import AWS from 'aws-sdk'
import { Readable } from 'stream'

interface StackResourceWatcher {
  addStackName(StackName: string): any
  removeStackName(StackName: string): any
  stop?(): any
}

export default function deployCloudFormationStack(options: {
  awsConfig?: AWS.ConfigurationOptions | null
  cloudformation?: AWS.CloudFormation | null | undefined
  watchResources?: boolean | null | undefined
  region?: string | null | undefined
  approve?: boolean | null | undefined
  StackName: AWS.CloudFormation.StackName
  Template?: Record<string, any> | null | undefined
  TemplateFile?: string | null | undefined
  TemplateBody?: Buffer | string | (() => Readable) | null | undefined
  StackPolicy?: AWS.CloudFormation.StackPolicyBody | null
  Parameters?:
    | Record<AWS.CloudFormation.ParameterKey, AWS.CloudFormation.ParameterValue>
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
  s3?: {
    Bucket: string
    prefix?: string | null | undefined
    SSEKMSKeyId?: string | null | undefined
    forceUpload?: boolean | null | undefined
  }
  readOutputs?: boolean | null | undefined
  signalWatchable?: (() => any) | null | undefined
  replaceIfCreateFailed?: boolean | null | undefined
  watcher?: StackResourceWatcher | null | undefined
}): Promise<{
  ChangeSetName: AWS.CloudFormation.ChangeSetName
  ChangeSetType: AWS.CloudFormation.ChangeSetType
  HasChanges: boolean
  Outputs: Record<AWS.CloudFormation.OutputKey, AWS.CloudFormation.OutputValue>
}>
