import AWS from 'aws-sdk'
import { Readable, Writable } from 'stream'

export default function deployCloudFormationStacks(options: {
  awsConfig?: AWS.ConfigurationOptions | null
  cloudformation?: AWS.CloudFormation | null | undefined
  stacks: Array<{
    awsConfig?: AWS.ConfigurationOptions | null

    region?: string | null | undefined
    StackName: AWS.CloudFormation.StackName
    Template?: Record<string, any> | null | undefined
    TemplateFile?: string | null | undefined
    TemplateBody?: Buffer | string | (() => Readable) | null | undefined
    StackPolicy?: AWS.CloudFormation.StackPolicyBody | undefined
    Parameters?:
      | Record<
          AWS.CloudFormation.ParameterKey,
          AWS.CloudFormation.ParameterValue
        >
      | Array<AWS.CloudFormation.Parameter>
      | null
      | undefined
    Capabilities?: AWS.CloudFormation.Capabilities | null | undefined
    RoleARN?: string | null | undefined
    NotificationARNs?: Array<string> | null | undefined
    Tags?:
      | Record<AWS.CloudFormation.TagKey, AWS.CloudFormation.TagValue>
      | Array<AWS.CloudFormation.Tag>
      | null
      | undefined
    readOutputs?: boolean | null | undefined
    replaceIfCreateFailed?: boolean | null | undefined
    logEvents?: boolean | Writable
  }>
  s3?: {
    Bucket: string
    prefix?: string | null | undefined
    SSEKMSKeyId?: string | null | undefined
    forceUpload?: boolean | null | undefined
  }
}): Promise<
  Array<{
    ChangeSetName: AWS.CloudFormation.ChangeSetName
    ChangeSetType: AWS.CloudFormation.ChangeSetType
    HasChanges: boolean
    Outputs: Record<
      AWS.CloudFormation.OutputKey,
      AWS.CloudFormation.OutputValue
    >
  }>
>
