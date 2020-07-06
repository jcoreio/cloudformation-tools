import AWS from 'aws-sdk'
import { Readable } from 'stream'

type Parameter = {
  ParameterKey: string
  ParameterValue: string
  UsePreviousValue?: boolean | null | undefined
}

type Tag = {
  Key: string
  Value: string
}

export default function deployCloudFormationStack(options: {
  cloudformation?: AWS.CloudFormation | null | undefined
  watchResources?: boolean | null | undefined
  region?: string | null | undefined
  approve?: boolean | null | undefined
  StackName: string
  Template?: Record<string, any> | null | undefined
  TemplateFile?: string | null | undefined
  TemplateBody?: Buffer | string | (() => Readable) | null | undefined
  Parameters?: Record<string, any> | Array<Parameter> | null | undefined
  Capabilities?: Array<string> | null | undefined
  RoleARN?: string | null | undefined
  NotificationARNs?: Array<string> | null | undefined
  Tags?: Record<string, any> | Array<Tag> | null | undefined
  s3?: {
    Bucket: string
    prefix?: string | null | undefined
    SSEKMSKeyId?: string | null | undefined
    forceUpload?: boolean | null | undefined
  }
  readOutputs?: boolean | null | undefined
  signalWatchable?: (() => any) | null | undefined
}): Promise<{
  ChangeSetName: string
  ChangeSetType: string
  HasChanges: boolean
  UserAborted: boolean
  Outputs: Record<string, string>
}>
