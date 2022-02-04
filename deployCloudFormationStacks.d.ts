import { CloudFormation } from 'aws-sdk'
import { ConfigurationOptions } from 'aws-sdk/lib/config'
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

export default function deployCloudFormationStacks(options: {
  awsConfig?: ConfigurationOptions | null
  cloudformation?: CloudFormation | null | undefined
  watchResources?: boolean | null | undefined
  stacks: Array<{
    awsConfig?: ConfigurationOptions | null
    region?: string | null | undefined
    StackName: string
    Template?: Record<string, any> | null | undefined
    TemplateFile?: string | null | undefined
    TemplateBody?: Buffer | string | (() => Readable) | null | undefined
    StackPolicy?: Record<string, any> | undefined
    Parameters?: Record<string, any> | Array<Parameter> | null | undefined
    Capabilities?: Array<string> | null | undefined
    RoleARN?: string | null | undefined
    NotificationARNs?: Array<string> | null | undefined
    Tags?: Record<string, any> | Array<Tag> | null | undefined
    readOutputs?: boolean | null | undefined
    replaceIfCreateFailed?: boolean | null | undefined
  }>
  s3?: {
    Bucket: string
    prefix?: string | null | undefined
    SSEKMSKeyId?: string | null | undefined
    forceUpload?: boolean | null | undefined
  }
}): Promise<
  Array<{
    ChangeSetName: string
    ChangeSetType: string
    HasChanges: boolean
    UserAborted: boolean
    Outputs: Record<string, string>
  }>
>
