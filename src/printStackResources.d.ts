import AWS from 'aws-sdk'
import { Writable } from 'stream'

export default function printStackResources(options: {
  stream?: Writable | null | undefined
  resources: AWS.CloudFormation.StackResource[]
}): Promise<void>
