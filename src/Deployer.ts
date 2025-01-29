/**
 * @prettier
 */

import {
  ChangeSetType,
  CloudFormationClient,
  CreateChangeSetCommand,
  CreateChangeSetInput,
  DeleteChangeSetCommand,
  DescribeChangeSetCommand,
  DescribeStacksCommand,
  ExecuteChangeSetCommand,
  GetTemplateSummaryCommand,
  waitUntilStackCreateComplete,
  waitUntilStackUpdateComplete,
} from '@aws-sdk/client-cloudformation'
import { checkExceptions, createWaiter, WaiterState } from '@smithy/util-waiter'
import S3Uploader, { parseS3Url } from './S3Uploader'
import { Readable } from 'stream'
import { waitSettings } from './waitSettings'

/**
 * Adapted from https://github.com/aws/aws-cli/blob/develop/awscli/customizations/cloudformation/deployer.py
 * on 2019-01-21
 */
export default class Deployer {
  _client: CloudFormationClient
  changesetPrefix: string

  constructor(
    cloudformationClient: CloudFormationClient,
    { changesetPrefix }: { changesetPrefix?: string } = {}
  ) {
    this._client = cloudformationClient
    this.changesetPrefix =
      changesetPrefix || 'jcoreio-cloudformation-tools-package-deploy-'
  }

  async hasStack(StackName: string): Promise<boolean> {
    let result
    try {
      result = await this._client.send(new DescribeStacksCommand({ StackName }))
    } catch (error) {
      return false
    }
    if (!result?.Stacks?.length) return false

    // When you run CreateChangeSet on a a stack that does not exist,
    // CloudFormation will create a stack and set it's status
    // REVIEW_IN_PROGRESS. However this stack is cannot be manipulated
    // by "update" commands. Under this circumstances, we treat like
    // this stack does not exist and call CreateChangeSet will
    // ChangeSetType set to CREATE and not UPDATE.
    const stack = result.Stacks[0]
    return stack.StackStatus !== 'REVIEW_IN_PROGRESS'
  }

  async createChangeSet({
    StackName,
    ChangeSetName = `${this.changesetPrefix}${Date.now()}`,
    Description = `Created at ${new Date().toISOString()} UTC`,
    ChangeSetType,
    TemplateBody,
    UsePreviousTemplate,
    Parameters,
    s3Uploader,
    ...rest
  }: Omit<
    CreateChangeSetInput,
    'ChangeSetName' | 'TemplateBody' | 'TemplateURL' | 'StackName'
  > & {
    StackName: string
    ChangeSetName?: string
    TemplateBody?: string | Buffer | (() => Readable)
    s3Uploader?: S3Uploader
  }) {
    if (!(await this.hasStack(StackName))) {
      if (!ChangeSetType) ChangeSetType = 'CREATE'

      // When creating a new stack, UsePreviousValue: true is invalid.
      // For such parameters, users should either override with new value,
      // or set a Default value in template to successfully create a stack.
      Parameters = Parameters?.filter((p) => !p.UsePreviousValue)
    } else {
      if (!ChangeSetType) ChangeSetType = 'UPDATE'
      const summary = await this._client.send(
        new GetTemplateSummaryCommand({ StackName })
      )
      // UsePreviousValue not valid if parameter is new
      const existingParameters = new Set(
        summary.Parameters?.map((p) => p.ParameterKey)
      )
      Parameters = Parameters?.filter(
        (p) => !p.UsePreviousValue || existingParameters.has(p.ParameterKey)
      )
    }

    const params: CreateChangeSetInput = {
      StackName,
      ChangeSetName,
      ChangeSetType,
      Description,
      UsePreviousTemplate,
      Parameters,
      ...rest,
    }

    if (TemplateBody && UsePreviousTemplate) {
      throw new Error(
        `Passing both TemplateBody and UsePreviousTemplate is not allowed`
      )
    }

    // If an S3 uploader is available, use TemplateURL to deploy rather than
    // TemplateBody. This is required for large templates.
    if (s3Uploader && TemplateBody) {
      const url = await s3Uploader.uploadWithDedup({
        Body: TemplateBody,
        extension: 'template',
      })
      const { Key, versionId } = parseS3Url(url)
      params.TemplateURL = await s3Uploader.toPathStyleS3Url(Key, versionId)
    } else if (typeof TemplateBody === 'function') {
      throw new Error(
        'TemplateBody: () => stream.Readable is not supported without s3Uploader option'
      )
    } else if (TemplateBody) {
      params.TemplateBody = TemplateBody.toString()
    } else if (UsePreviousTemplate) {
      params.UsePreviousTemplate = true
    } else {
      throw new Error(`Must provide TemplateBody or UsePrevioiusTemplate`)
    }
    const { Id } = await this._client.send(new CreateChangeSetCommand(params))
    return { ChangeSetName: Id, ChangeSetType }
  }

  async describeChangeSet({
    ChangeSetName,
    StackName,
  }: {
    ChangeSetName: string
    StackName: string
  }) {
    const { Changes } = await this._client.send(
      new DescribeChangeSetCommand({ ChangeSetName, StackName })
    )
    return Changes
  }

  async waitForChangeSet({
    ChangeSetName,
    StackName,
  }: {
    ChangeSetName: string
    StackName: string
  }): Promise<{ HasChanges: boolean }> {
    process.stderr.write(
      `Waiting for changeset to be created - ${StackName}...\n`
    )

    let HasChanges = true

    const result = await createWaiter(
      {
        ...waitSettings,
        minDelay: 2000,
        maxDelay: 10000,
        client: this._client,
      },
      { ChangeSetName, StackName },
      async (client, input) => {
        let reason
        try {
          const result = await client.send(new DescribeChangeSetCommand(input))
          reason = result
          switch (result.Status) {
            case 'CREATE_COMPLETE':
              return { state: WaiterState.SUCCESS, reason }
            case 'DELETE_PENDING':
            case 'DELETE_IN_PROGRESS':
            case 'DELETE_FAILED':
            case 'DELETE_COMPLETE':
            case 'FAILED': {
              const statusLower = (result.StatusReason || '').toLowerCase()
              if (
                statusLower.startsWith('no updates are to be performed') ||
                statusLower.startsWith(
                  "the submitted information didn't contain changes"
                )
              ) {
                HasChanges = false
                return { state: WaiterState.SUCCESS, reason }
              } else {
                return { state: WaiterState.FAILURE, reason }
              }
            }
          }
        } catch (exception) {
          reason = exception
          if (
            exception instanceof Object &&
            'name' in exception &&
            exception.name == 'ValidationError'
          ) {
            return { state: WaiterState.FAILURE, reason }
          }
        }
        return { state: WaiterState.RETRY, reason }
      }
    )
    checkExceptions(result)

    return { HasChanges }
  }

  async executeChangeSet({
    ChangeSetName,
    StackName,
  }: {
    ChangeSetName: string
    StackName: string
  }) {
    return await this._client.send(
      new ExecuteChangeSetCommand({
        ChangeSetName,
        StackName,
      })
    )
  }

  async waitForExecute({
    StackName,
    ChangeSetType,
  }: {
    StackName: string
    ChangeSetType: ChangeSetType
  }): Promise<void> {
    process.stderr.write(
      `Waiting for stack create/update to complete - ${StackName}...\n`
    )
    await (ChangeSetType === 'CREATE'
      ? waitUntilStackCreateComplete(
          { client: this._client, ...waitSettings },
          { StackName }
        )
      : waitUntilStackUpdateComplete(
          { client: this._client, ...waitSettings },
          { StackName }
        ))

    process.stderr.write(`Successfully created/updated stack - ${StackName}\n`)
  }

  async createAndWaitForChangeSet(
    options: Parameters<Deployer['createChangeSet']>[0]
  ) {
    const { StackName } = options
    const { ChangeSetName, ChangeSetType } = await this.createChangeSet(options)
    if (!ChangeSetName) {
      throw new Error(
        `unexpected: createChangeSet response is missing ChangeSetName`
      )
    }

    const { HasChanges } = await this.waitForChangeSet({
      ChangeSetName,
      StackName,
    })

    if (!HasChanges) {
      await this._client.send(
        new DeleteChangeSetCommand({
          StackName,
          ChangeSetName,
        })
      )
    }

    return { ChangeSetName, ChangeSetType, HasChanges }
  }
}
