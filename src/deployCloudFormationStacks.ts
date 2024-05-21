import deployCloudFormationStack from './deployCloudFormationStack'
import AWS from 'aws-sdk'
import { Readable, Writable } from 'stream'

export default function deployCloudFormationStacks({
  awsConfig,
  cloudformation,
  s3,
  stacks,
}: {
  cloudformation?: AWS.CloudFormation
  awsConfig?: AWS.ConfigurationOptions
  s3?: {
    Bucket: string
    prefix?: string
    SSEKMSKeyId?: string
    forceUpload?: boolean
  }
  stacks: ReadonlyArray<{
    region?: string
    awsConfig?: AWS.ConfigurationOptions
    StackName: string
    Template?: any
    TemplateFile?: string
    TemplateBody?: Buffer | string | (() => Readable)
    StackPolicy?: AWS.CloudFormation.StackPolicyBody
    Parameters?:
      | {
          [key: string]: AWS.CloudFormation.ParameterValue
        }
      | AWS.CloudFormation.Parameters
    Capabilities?: AWS.CloudFormation.Capabilities
    RoleARN?: string
    NotificationARNs?: string[]
    Tags?:
      | {
          [key: string]: AWS.CloudFormation.TagValue
        }
      | AWS.CloudFormation.Tags
    readOutputs?: boolean
    replaceIfCreateFailed?: boolean
    logEvents?: Writable | boolean
  }>
}): Promise<
  Array<{
    ChangeSetName: string
    ChangeSetType: string
    HasChanges: boolean
    Outputs: {
      [resourceName: string]: string
    }
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
