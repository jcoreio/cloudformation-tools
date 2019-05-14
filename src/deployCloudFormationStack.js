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
import watchStackResources from './watchStackResources'
import { map } from 'lodash'

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
  cloudformation,
  watchResources,
  region,
  approve,
  StackName,
  TemplateFile,
  TemplateBody,
  Parameters,
  Capabilities,
  RoleARN,
  NotificationARNs,
  Tags,
}: {
  cloudformation?: ?AWS.CloudFormation,
  watchResources?: ?boolean,
  region?: ?string,
  approve?: ?boolean,
  StackName: string,
  TemplateFile?: ?string,
  TemplateBody?: ?string,
  Parameters?: ?({ [string]: any } | Array<Parameter>),
  Capabilities?: ?Array<string>,
  RoleARN?: ?string,
  NotificationARNs?: ?Array<string>,
  Tags?: ?({ [string]: any } | Array<Tag>),
}): Promise<{
  ChangeSetName: string,
  ChangeSetType: string,
  HasChanges: boolean,
  UserAborted: boolean,
}> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation)
    cloudformation = new AWS.CloudFormation(region ? { region } : {})
  const deployer = new Deployer(cloudformation)

  if (Parameters && !Array.isArray(Parameters)) {
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

  if (!TemplateBody) {
    if (TemplateFile) {
      TemplateBody = await fs.readFile(TemplateFile, 'utf8')
    } else {
      throw new Error(`TemplateBody or TemplateFile is required`)
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
          UserAborted = 'y' !== answerLower && 'yes' !== 'answerLower'
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
        watchInterval = watchResources
          ? watchStackResources({ cloudformation, StackName })
          : null
        await deployer.waitForExecute({
          StackName,
          ChangeSetType,
        })
      } catch (error) {
        if (watchInterval != null) clearInterval(watchInterval)
        await describeCloudFormationFailure({
          cloudformation,
          StackName,
        }).catch(() => {})
        throw error
      } finally {
        if (watchInterval != null) clearInterval(watchInterval)
      }
    }
  }
  return { ChangeSetName, ChangeSetType, HasChanges, UserAborted }
}
