import { Writable } from 'stream'
import { ConfigurationOptions } from 'aws-sdk/lib/config'

export default function describeCloudFormationFailure(options: {
  stream?: Writable | null | undefined
  awsConfig?: ConfigurationOptions | null
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName: string
}): Promise<void>
