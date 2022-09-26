/**
 * @prettier
 * @flow
 */

import deployCloudFormationStack from './deployCloudFormationStack'
import AWS from 'aws-sdk'
import { type Readable, type Writable } from 'stream'

type Parameter = {
  ParameterKey: string,
  ParameterValue: string,
  UsePreviousValue?: ?boolean,
}

type Tag = {
  Key: string,
  Value: string,
}

export default function deployCloudFormationStacks({
  awsConfig,
  cloudformation,
  s3,
  stacks,
}: {
  cloudformation?: ?AWS.CloudFormation,
  awsConfig?: ?{ ... },
  s3?: {
    Bucket: string,
    prefix?: ?string,
    SSEKMSKeyId?: ?string,
    forceUpload?: ?boolean,
  },
  stacks: $ReadOnlyArray<{
    region?: ?string,
    awsConfig?: ?{ ... },
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
    readOutputs?: ?boolean,
    replaceIfCreateFailed?: ?boolean,
    logEvents?: Writable | boolean,
  }>,
}): Promise<
  Array<{
    ChangeSetName: string,
    ChangeSetType: string,
    HasChanges: boolean,
    Outputs: { [resourceName: string]: string },
  }>
> {
  return Promise.all(
    stacks.map((stack) =>
      deployCloudFormationStack({
        awsConfig,
        ...stack,
        cloudformation,
        s3,
        approve: false,
      })
    )
  )
}
