import { Writable } from 'stream'

export default function describeCloudFormationFailure(options: {
  stream?: Writable | null | undefined
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName: string
}): Promise<void>
