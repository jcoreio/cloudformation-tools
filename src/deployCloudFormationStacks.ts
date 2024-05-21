import {
  Capability,
  CloudFormationClient,
  CloudFormationClientConfig,
  Parameter,
  SetStackPolicyCommandInput,
  Tag,
} from '@aws-sdk/client-cloudformation'
import deployCloudFormationStack from './deployCloudFormationStack'
import { Readable, Writable } from 'stream'

export default function deployCloudFormationStacks({
  awsConfig,
  cloudformation,
  s3,
  stacks,
}: {
  cloudformation?: CloudFormationClient
  awsConfig?: CloudFormationClientConfig
  s3?: {
    Bucket: string
    prefix?: string
    SSEKMSKeyId?: string
    forceUpload?: boolean
  }
  stacks: ReadonlyArray<{
    region?: string
    awsConfig?: CloudFormationClientConfig
    StackName: string
    Template?: any
    TemplateFile?: string
    TemplateBody?: Buffer | string | (() => Readable)
    StackPolicy?: SetStackPolicyCommandInput['StackPolicyBody']
    Parameters?:
      | {
          [key: string]: Parameter['ParameterValue']
        }
      | Parameter[]
    Capabilities?: Capability[]
    RoleARN?: string
    NotificationARNs?: string[]
    Tags?:
      | {
          [key: string]: Tag['Value']
        }
      | Tag[]
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
