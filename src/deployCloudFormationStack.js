/**
 *@flow
 * @prettier
 */

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
}> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation()
  const deployer = new Deployer(cloudformation)

  if (Parameters && !Array.isArray(Parameters)) {
    Parameters = map(Parameters, (value, key) => ({
      ParameterKey: key,
      ParameterValue: String(value),
    }))
  }
  if (Tags && !Array.isArray(Tags)) {
    Tags = map(Tags, (Value, Key) => ({ Key, Value: String(Value) }))
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
  } = await deployer.createAndWaitForChangeSet({
    StackName,
    TemplateBody,
    Parameters,
    Capabilities,
    RoleARN,
    NotificationARNs,
    Tags,
  })
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
    return { ChangeSetName, ChangeSetType }
  } catch (error) {
    if (watchInterval != null) clearInterval(watchInterval)
    await describeCloudFormationFailure({ cloudformation, StackName }).catch(
      () => {}
    )
    throw error
  } finally {
    if (watchInterval != null) clearInterval(watchInterval)
  }
}
