/**
 * @prettier
 */

import { parseS3Url } from './S3Uploader'

/**
 * Adapted from https://github.com/aws/aws-cli/blob/develop/awscli/customizations/cloudformation/deployer.py
 * on 2019-01-21
 */
export default class Deployer {
  constructor(cloudformationClient, { changesetPrefix } = {}) {
    this._client = cloudformationClient
    this.changesetPrefix =
      changesetPrefix || 'awscli-cloudformation-package-deploy-'
  }

  async hasStack(StackName) {
    let result
    try {
      result = await this._client.describeStacks({ StackName }).promise()
    } catch (error) {
      if (/stack.+does not exist/i.test(error.message)) return false
    }
    if (!result || result.Stacks.length !== 1) return false

    // When you run CreateChangeSet on a a stack that does not exist,
    // CloudFormation will create a stack and set it's status
    // REVIEW_IN_PROGRESS. However this stack is cannot be manipulated
    // by "update" commands. Under this circumstances, we treat like
    // this stack does not exist and call CreateChangeSet will
    // ChangeSetType set to CREATE and not UPDATE.
    const stack = result.Stacks[0]
    return stack.StackStatus != 'REVIEW_IN_PROGRESS'
  }

  async createChangeSet({
    StackName,
    TemplateBody,
    Parameters,
    Capabilities,
    RoleARN,
    NotificationARNs,
    s3Uploader,
    Tags,
  }) {
    const Description = `Created at {new Date().toISOString()} UTC`
    const ChangeSetName = `${this.changesetPrefix}${Date.now()}`

    let ChangeSetType
    if (!(await this.hasStack(StackName))) {
      ChangeSetType = 'CREATE'

      // When creating a new stack, UsePreviousValue: true is invalid.
      // For such parameters, users should either override with new value,
      // or set a Default value in template to successfully create a stack.
      Parameters = Parameters.filter(p => !p.UsePreviousValue)
    } else {
      ChangeSetType = 'UPDATE'
      const summary = await this._client
        .getTemplateSummary({ StackName })
        .promise()
      // UsePreviousValue not valid if parameter is new
      const existingParameters = new Set(
        summary.Parameters.map(p => p.ParameterKey)
      )
      Parameters = Parameters.filter(
        p => !p.UsePreviousValue || existingParameters.has(p.ParameterKey)
      )
    }

    const params = {
      ChangeSetName,
      StackName,
      TemplateBody,
      ChangeSetType,
      Parameters,
      Capabilities,
      Description,
      Tags,
    }

    // If an S3 uploader is available, use TemplateURL to deploy rather than
    // TemplateBody. This is required for large templates.
    if (s3Uploader) {
      const url = await s3Uploader.uploadWithDedup({
        Body: TemplateBody,
        extension: 'template',
      })
      const { Key, versionId } = parseS3Url(url)
      params.TemplateURL = s3Uploader.toPathStyleS3Url(Key, versionId)
      delete params.TemplateBody
    } else if (typeof TemplateBody === 'function') {
      throw new Error(
        'TemplateBody: () => stream.Readable is not supported without s3Uploader option'
      )
    }
    if (RoleARN) params.RoleARN = RoleARN
    if (NotificationARNs) params.NotificationARNs = NotificationARNs

    const { Id } = await this._client.createChangeSet(params).promise()
    return { ChangeSetName: Id, ChangeSetType }
  }

  async describeChangeSet({
    ChangeSetName,
    StackName,
  }: {
    ChangeSetName: string,
    StackName: string,
  }) {
    const { Changes } = await this._client
      .describeChangeSet({ ChangeSetName, StackName })
      .promise()
    return Changes
  }

  async waitForChangeSet({
    ChangeSetName,
    StackName,
  }): Promise<{ HasChanges: boolean }> {
    process.stderr.write(
      `\nWaiting for changeset to be created - ${StackName}...\n`
    )
    let retriesRemaining = 20
    let done = false
    let HasChanges = true
    do {
      if (--retriesRemaining <= 0)
        throw Error('timed out waiting for changeset to be created')

      const { Summaries } = await this._client
        .listChangeSets({
          StackName,
        })
        .promise()

      const thisChangeSetInfo = Summaries.find(
        row => ChangeSetName === row.ChangeSetId
      )
      if (thisChangeSetInfo) {
        const { Status, StatusReason } = thisChangeSetInfo
        switch (Status) {
          case 'CREATE_COMPLETE':
            done = true
            break
          case 'CREATE_PENDING':
          case 'CREATE_IN_PROGRESS':
            break
          case 'DELETE_COMPLETE':
            throw Error(
              `unexpected DELETE_COMPLETE status for ChangeSet ${ChangeSetName}`
            )
          case 'FAILED':
            if (
              StatusReason &&
              StatusReason.toLowerCase().startsWith(
                'no updates are to be performed'
              )
            ) {
              done = true
              HasChanges = false
            } else {
              throw Error(
                `ChangeSet ${ChangeSetName} failed to create: ${StatusReason}`
              )
            }
            break
          default:
            throw Error(`unexpected ChangeSet Status: ${Status}`)
        }
      }
      if (!done) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } while (!done)
    return { HasChanges }
  }

  async executeChangeSet({ ChangeSetName, StackName }) {
    return await this._client
      .executeChangeSet({
        ChangeSetName,
        StackName,
      })
      .promise()
  }

  async waitForExecute({ StackName, ChangeSetType }) {
    process.stderr.write('Waiting for stack create/update to complete\n')
    await this._client
      .waitFor(
        ChangeSetType === 'CREATE'
          ? 'stackCreateComplete'
          : 'stackUpdateComplete',
        { StackName }
      )
      .promise()
    process.stderr.write(`Successfully created/updated stack - ${StackName}\n`)
  }

  async createAndWaitForChangeSet({
    StackName,
    TemplateBody,
    Parameters,
    Capabilities,
    RoleARN,
    NotificationARNs,
    s3Uploader,
    Tags,
  }) {
    const { ChangeSetName, ChangeSetType } = await this.createChangeSet({
      StackName,
      TemplateBody,
      Parameters,
      Capabilities,
      RoleARN,
      NotificationARNs,
      s3Uploader,
      Tags,
    })

    const { HasChanges } = await this.waitForChangeSet({
      ChangeSetName,
      StackName,
    })

    if (!HasChanges) {
      await this._client
        .deleteChangeSet({
          StackName,
          ChangeSetName,
        })
        .promise()
    }

    return { ChangeSetName, ChangeSetType, HasChanges }
  }
}
