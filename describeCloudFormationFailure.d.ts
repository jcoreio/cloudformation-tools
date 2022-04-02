import { Writable } from 'stream'
import AWS from 'aws-sdk'

export default function describeCloudFormationFailure(options: {
  stream?: Writable | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName: AWS.CloudFormation.StackName
}): Promise<void>
