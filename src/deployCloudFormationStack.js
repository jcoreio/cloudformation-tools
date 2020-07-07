/**
 *@flow
 * @prettier
 */

import readline from 'readline'
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

type Parameter = {
  ParameterKey: string,
  ParameterValue: string,
  UsePreviousValue?: ?boolean,
}

type Tag = {
  Key: string,
  Value: string,
}

interface StackResourceWatcher {
  addStackName(StackName: string): any;
  removeStackName(StackName: string): any;
  stop?: () => any;
}

export default async function deployCloudFormationStack({
  cloudformation,
  watchResources,
  region,
  approve,
  StackName,
  Template,
  TemplateFile,
  TemplateBody,
  Parameters,
  Capabilities,
  RoleARN,
  NotificationARNs,
  Tags,
  s3,
  readOutputs,
  signalWatchable,
  watcher,
}: {
  cloudformation?: ?AWS.CloudFormation,
  watchResources?: ?boolean,
  region?: ?string,
  approve?: ?boolean,
  StackName: string,
  Template?: ?Object,
  TemplateFile?: ?string,
  TemplateBody?: ?(Buffer | string | (() => Readable)),
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
}): Promise<{
  ChangeSetName: string,
  ChangeSetType: string,
  HasChanges: boolean,
  UserAborted: boolean,
  Outputs: { [resourceName: string]: string },
}> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation)
    cloudformation = new AWS.CloudFormation(region ? { region } : {})
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
    ? new S3Uploader({ ...s3, s3: new AWS.S3(region ? { region } : {}) })
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
  let UserAborted = false
  if (HasChanges) {
    if (approve) {
      const changes = await deployer.describeChangeSet({
        ChangeSetName,
        StackName,
      })
      // eslint-disable-next-line no-console
      console.error(
        `Changes to stack:\n${inspect(changes, { colors: true, depth: 5 })}`
      )
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
      })
      await new Promise((resolve: () => any) => {
        rl.question('Deploy stack? [y/n]:', (answer: string) => {
          const answerLower = answer && answer.toLowerCase()
          UserAborted = 'y' !== answerLower && 'yes' !== answerLower
          // eslint-disable-next-line no-console
          console.error(
            UserAborted ? 'OK, aborted deployment' : 'OK, deploying...'
          )
          rl.close()
          resolve()
        })
      })
    }

    if (!UserAborted) {
      let watchInterval: ?IntervalID
      try {
        await deployer.executeChangeSet({
          ChangeSetName,
          StackName,
        })
        if (signalWatchable) signalWatchable()
        if (watcher) watcher.addStackName(StackName)
        watchInterval = watchResources
          ? watchStackResources({ cloudformation, StackName })
          : null
        await deployer.waitForExecute({
          StackName,
          ChangeSetType,
        })
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
  } else {
    // eslint-disable-next-line no-console
    console.log('stack is already in the desired state')
  }

  const Outputs = readOutputs
    ? await getStackOutputs({ region, StackName })
    : {}
  return {
    ChangeSetName,
    ChangeSetType,
    HasChanges,
    UserAborted,
    Outputs,
  }
}
