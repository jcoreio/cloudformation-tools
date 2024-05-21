import { inspect } from 'util'
import AWS from 'aws-sdk'
import fs from 'fs-extra'
import Deployer from './Deployer'
import describeCloudFormationFailure from './describeCloudFormationFailure'
import getStackOutputs from './getStackOutputs'
import { map } from 'lodash'
import { Readable } from 'stream'
import S3Uploader from './S3Uploader'
import inquirer from 'inquirer'
import { Writable } from 'stream'
import watchStackEvents from './watchStackEvents'
import printStackEvents from './printStackEvents'
type Parameter = {
  ParameterKey: string
  ParameterValue: string
  UsePreviousValue?: boolean
}
type Tag = {
  Key: string
  Value: string
}
export default async function deployCloudFormationStack({
  cloudformation: _cloudformation,
  region,
  awsConfig,
  approve,
  StackName,
  Template,
  TemplateFile,
  TemplateBody,
  StackPolicy,
  Parameters: _Parameters,
  Capabilities,
  RoleARN,
  NotificationARNs,
  Tags: _Tags,
  s3,
  readOutputs,
  replaceIfCreateFailed,
  logEvents = true,
}: {
  cloudformation?: AWS.CloudFormation
  region?: string
  awsConfig?: Record<any, any>
  approve?: boolean
  StackName: string
  Template?: any
  TemplateFile?: string
  TemplateBody?: string | Buffer | (() => Readable)
  StackPolicy?: any
  Parameters?:
    | (
        | {
            [key: string]: any
          }
        | Array<Parameter>
      )
    | undefined
  Capabilities?: Array<string> | undefined
  RoleARN?: string | undefined
  NotificationARNs?: Array<string> | undefined
  Tags?:
    | (
        | {
            [key: string]: any
          }
        | Array<Tag>
      )
    | undefined
  s3?: {
    Bucket: string
    prefix?: string
    SSEKMSKeyId?: string
    forceUpload?: boolean
  }
  logEvents?: Writable | boolean
  readOutputs?: boolean
  replaceIfCreateFailed?: boolean
}): Promise<{
  ChangeSetName: string
  ChangeSetType: string
  HasChanges: boolean
  Outputs: {
    [resourceName: string]: string
  }
}> {
  if (!StackName) throw new Error('missing StackName')
  if (!awsConfig)
    awsConfig = {
      ...(region
        ? {
            region,
          }
        : {}),
    }
  const cloudformation = _cloudformation || new AWS.CloudFormation(awsConfig)
  const deployer = new Deployer(cloudformation)
  const Parameters =
    _Parameters && !Array.isArray(_Parameters)
      ? map(_Parameters, (value, key) => ({
          ParameterKey: key,
          ParameterValue: value == null ? null : String(value),
        })).filter((p) => p.ParameterValue != null)
      : _Parameters
  const Tags =
    _Tags && !Array.isArray(_Tags)
      ? map(_Tags, (Value, Key) => ({
          Key,
          Value: Value == null ? null : String(Value),
        })).filter((t) => t.Value != null)
      : _Tags
  const s3Uploader = s3
    ? new S3Uploader({
        ...s3,
        s3: new AWS.S3(awsConfig),
      })
    : undefined
  if (!TemplateBody) {
    if (Template) {
      TemplateBody = JSON.stringify(Template, null, 2)
    } else if (TemplateFile) {
      TemplateBody = s3Uploader
        ? () => fs.createReadStream(TemplateFile, 'utf8')
        : await fs.readFile(TemplateFile, 'utf8')
    } else {
      throw new Error(`Template, TemplateFile or TemplateBody is required`)
    }
  }
  async function watchDuring<R>(procedure: () => Promise<R>): Promise<R> {
    const ac = new AbortController()
    try {
      printStackEvents({
        printHeader: true,
        out: typeof logEvents === 'boolean' ? process.stderr : logEvents,
        events: watchStackEvents({
          cloudformation,
          StackName,
          signal: ac.signal,
          since: Date.now(),
        }),
      }).catch(() => {})
      return await procedure()
    } catch (error: any) {
      ac.abort()
      await describeCloudFormationFailure({
        cloudformation,
        StackName,
      }).catch(() => {})
      throw error
    } finally {
      ac.abort()
    }
  }
  const { Stacks: [ExistingStack] = [] } = await cloudformation
    .describeStacks({
      StackName,
    })
    .promise()
    .catch(() => ({
      Stacks: [],
    }))
  if (ExistingStack) {
    const { StackStatus } = ExistingStack
    const createFailed = [
      'CREATE_FAILED',
      'ROLLBACK_FAILED',
      'ROLLBACK_COMPLETE',
      'ROLLBACK_IN_PROGRESS',
    ].includes(StackStatus)
    if (StackPolicy && !createFailed) {
      process.stderr.write(`Setting policy on stack ${StackName}...\n`)
      await cloudformation
        .setStackPolicy({
          StackName,
          StackPolicyBody: JSON.stringify(StackPolicy, null, 2),
        })
        .promise()
    }
    if (createFailed && replaceIfCreateFailed) {
      if (approve) {
        const { approved } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'approved',
            message: `Stack ${StackName} already exists in ${StackStatus} state; do you want to delete it?`,
            default: true,
          },
        ])
        if (!approved) {
          throw new Error(
            `Stack ${StackName} already exists in ${StackStatus} state, but you chose not to delete it`
          )
        }
      }
      process.stderr.write(
        `Deleting existing ${StackStatus} stack: ${StackName}...\n`
      )
      Promise.all([
        cloudformation
          .waitFor('stackDeleteComplete', {
            StackName,
          })
          .promise(),
        cloudformation
          .deleteStack({
            StackName,
          })
          .promise(),
      ])
    } else if (
      /_IN_PROGRESS$/.test(StackStatus) &&
      StackStatus !== 'REVIEW_IN_PROGRESS'
    ) {
      const event = (() => {
        switch (StackStatus) {
          case 'CREATE_IN_PROGRESS':
            return 'stackCreateComplete'
          case 'ROLLBACK_IN_PROGRESS':
          case 'UPDATE_ROLLBACK_IN_PROGRESS':
          case 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS':
            return 'stackRollbackComplete'
          case 'UPDATE_IN_PROGRESS':
          case 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS':
            return 'stackUpdateComplete'
          case 'DELETE_IN_PROGRESS':
            return 'stackDeleteComplete'
          case 'IMPORT_IN_PROGRESS':
          case 'IMPORT_ROLLBACK_IN_PROGRESS':
            return 'stackImportComplete'
        }
        return undefined
      })()
      if (event) {
        process.stderr.write(
          `Waiting for ${event} to complete on existing stack ${StackName}...\n`
        )
        await watchDuring(() =>
          cloudformation
            .waitFor(
              // @ts-expect-error the overload types aren't cooperative
              event
            )
            .promise()
        )
      }
    }
  }
  const { ChangeSetName, ChangeSetType, HasChanges } =
    await deployer.createAndWaitForChangeSet({
      StackName,
      TemplateBody,
      Parameters,
      Capabilities,
      RoleARN,
      NotificationARNs,
      Tags,
      s3Uploader,
    })
  if (HasChanges) {
    if (approve) {
      const changes = await deployer.describeChangeSet({
        ChangeSetName,
        StackName,
      })
      process.stderr.write(
        `Changes to stack ${StackName}:\n${inspect(changes, {
          colors: true,
          depth: 5,
        })}\n`
      )
      const { approved } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'approved',
          message: 'Deploy stack?',
          default: true,
        },
      ])
      process.stderr.write(
        approved ? 'OK, deploying...\n' : 'OK, aborted deployment\n'
      )
      if (!approved) {
        if (ExistingStack) {
          process.stderr.write(
            `Deleting aborted change set ${ChangeSetName} on stack ${StackName}...\n`
          )
          await cloudformation
            .deleteChangeSet({
              StackName,
              ChangeSetName,
            })
            .promise()
        } else {
          process.stderr.write(`Deleting aborted stack ${StackName}...\n`)
          await Promise.all([
            cloudformation
              .waitFor('stackDeleteComplete', {
                StackName,
              })
              .promise(),
            cloudformation
              .deleteStack({
                StackName,
              })
              .promise(),
          ])
        }
        throw new Error(
          `User aborted deployment of change set ${ChangeSetName} on stack ${StackName}`
        )
      }
    }
    await watchDuring(async () => {
      await deployer.executeChangeSet({
        ChangeSetName,
        StackName,
      })
      await deployer.waitForExecute({
        StackName,
        ChangeSetType,
      })
    })
  } else {
    process.stderr.write(`Stack ${StackName} is already in the desired state\n`)
  }
  if (StackPolicy && !ExistingStack) {
    await cloudformation
      .setStackPolicy({
        StackName,
        StackPolicyBody: JSON.stringify(StackPolicy, null, 2),
      })
      .promise()
  }
  const Outputs = readOutputs
    ? await getStackOutputs({
        region,
        StackName,
        cloudformation,
      })
    : {}
  return {
    ChangeSetName,
    ChangeSetType,
    HasChanges,
    Outputs,
  }
}
