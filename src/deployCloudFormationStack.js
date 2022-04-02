/**
 *@flow
 * @prettier
 */

import { inspect } from 'util'
import AWS from 'aws-sdk'
import fs from 'fs-extra'
import Deployer from './Deployer'
import describeCloudFormationFailure from './describeCloudFormationFailure'
import getStackOutputs from './getStackOutputs'
import watchStackResources from './watchStackResources'
import { map } from 'lodash'
import { type Readable } from 'stream'
import S3Uploader from './S3Uploader'
import type StackResourceWatcher from './StackResourceWatcher'
import inquirer from 'inquirer'

type Parameter = {
  ParameterKey: string,
  ParameterValue: string,
  UsePreviousValue?: ?boolean,
}

type Tag = {
  Key: string,
  Value: string,
}

export default async function deployCloudFormationStack({
  cloudformation: _cloudformation,
  watchResources,
  region,
  awsConfig,
  approve,
  StackName,
  Template,
  TemplateFile,
  TemplateBody,
  StackPolicy,
  Parameters,
  Capabilities,
  RoleARN,
  NotificationARNs,
  Tags,
  s3,
  readOutputs,
  signalWatchable,
  watcher,
  replaceIfCreateFailed,
}: {
  cloudformation?: ?AWS.CloudFormation,
  watchResources?: ?boolean,
  region?: ?string,
  awsConfig?: ?{ ... },
  approve?: ?boolean,
  StackName: string,
  Template?: ?Object,
  TemplateFile?: ?string,
  TemplateBody?: ?(Buffer | string | (() => Readable)),
  StackPolicy?: ?Object,
  Parameters?: ?({ [string]: any } | Array<Parameter>),
  Capabilities?: ?Array<string>,
  RoleARN?: ?string,
  NotificationARNs?: ?Array<string>,
  Tags?: ?({ [string]: any } | Array<Tag>),
  s3?: {
    Bucket: string,
    prefix?: ?string,
    SSEKMSKeyId?: ?string,
    forceUpload?: ?boolean,
  },
  readOutputs?: ?boolean,
  signalWatchable?: ?() => mixed,
  watcher?: ?StackResourceWatcher,
  replaceIfCreateFailed?: ?boolean,
}): Promise<{
  ChangeSetName: string,
  ChangeSetType: string,
  HasChanges: boolean,
  Outputs: { [resourceName: string]: string },
}> {
  if (!StackName) throw new Error('missing StackName')
  if (!awsConfig) awsConfig = { ...(region ? { region } : {}) }
  const cloudformation = _cloudformation || new AWS.CloudFormation(awsConfig)
  const deployer = new Deployer(cloudformation)

  if (!Parameters) {
    Parameters = []
  } else if (Parameters && !Array.isArray(Parameters)) {
    Parameters = map(Parameters, (value, key) => ({
      ParameterKey: key,
      ParameterValue: value == null ? null : String(value),
    })).filter(p => p.ParameterValue != null)
  }
  if (Tags && !Array.isArray(Tags)) {
    Tags = map(Tags, (Value, Key) => ({
      Key,
      Value: Value == null ? null : String(Value),
    })).filter(t => t.Value != null)
  }

  const s3Uploader = s3
    ? new S3Uploader({ ...s3, s3: new AWS.S3(awsConfig) })
    : null

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
    let watchInterval: ?IntervalID
    try {
      if (signalWatchable) signalWatchable()
      if (watcher) watcher.addStackName(StackName)
      else {
        watchInterval = watchResources
          ? watchStackResources({ cloudformation, awsConfig, StackName })
          : null
      }
      return await procedure()
    } catch (error) {
      if (watchInterval != null) clearInterval(watchInterval)
      if (watcher && watcher.stop) watcher.stop()
      await describeCloudFormationFailure({
        cloudformation,
        StackName,
      }).catch(() => {})
      throw error
    } finally {
      if (watchInterval != null) clearInterval(watchInterval)
      if (watcher) watcher.removeStackName(StackName)
    }
  }

  const {
    Stacks: [ExistingStack],
  } = await cloudformation
    .describeStacks({
      StackName,
    })
    .promise()
    .catch(() => ({ Stacks: [] }))

  if (ExistingStack) {
    const { StackStatus } = ExistingStack
    const createFailed = [
      'CREATE_FAILED',
      'ROLLBACK_FAILED',
      'ROLLBACK_COMPLETE',
      'ROLLBACK_IN_PROGRESS',
    ].includes(StackStatus)

    if (StackPolicy && !createFailed) {
      // eslint-disable-next-line no-console
      console.error(`Setting policy on stack ${StackName}...`)
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
      // eslint-disable-next-line no-console
      console.error(`Deleting existing ${StackStatus} stack: ${StackName}...`)
      await watchDuring(() =>
        Promise.all([
          cloudformation
            .waitFor('stackDeleteComplete', { StackName })
            .promise(),
          cloudformation.deleteStack({ StackName }).promise(),
        ])
      )
    } else if (/_IN_PROGRESS$/.test(StackStatus)) {
      // eslint-disable-next-line no-console
      console.error(
        `Waiting for ${StackStatus.replace(/^(.*)_IN_PROGRESS$/, (m, a) =>
          a.toLowerCase()
        )} to complete on existing stack ${StackName}...`
      )
      await watchDuring(() =>
        cloudformation
          .waitFor(
            StackStatus.replace(
              /^(.)(.*)_IN_PROGRESS$/,
              (m, a, b) => `stack${a}${b.toLowerCase()}Complete`
            )
          )
          .promise()
      )
    }
  }

  const {
    ChangeSetName,
    ChangeSetType,
    HasChanges,
  } = await deployer.createAndWaitForChangeSet({
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
      // eslint-disable-next-line no-console
      console.error(
        `Changes to stack ${StackName}:\n${inspect(changes, {
          colors: true,
          depth: 5,
        })}`
      )
      const { approved } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'approved',
          message: 'Deploy stack?',
          default: true,
        },
      ])
      // eslint-disable-next-line no-console
      console.error(approved ? 'OK, deploying...' : 'OK, aborted deployment')
      if (!approved) {
        if (ExistingStack) {
          // eslint-disable-next-line no-console
          console.error(
            `Deleting aborted change set ${ChangeSetName} on stack ${StackName}...`
          )
          await cloudformation
            .deleteChangeSet({ StackName, ChangeSetName })
            .promise()
        } else {
          // eslint-disable-next-line no-console
          console.error(`Deleting aborted stack ${StackName}...`)
          await Promise.all([
            cloudformation
              .waitFor('stackDeleteComplete', { StackName })
              .promise(),
            cloudformation.deleteStack({ StackName }).promise(),
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
    // eslint-disable-next-line no-console
    console.error(`Stack ${StackName} is already in the desired state`)
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
    ? await getStackOutputs({ region, StackName, cloudformation })
    : {}
  return {
    ChangeSetName,
    ChangeSetType,
    HasChanges,
    Outputs,
  }
}
