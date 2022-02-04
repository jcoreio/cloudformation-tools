import { CloudFormation } from 'aws-sdk'
import { ConfigurationOptions } from 'aws-sdk/lib/config'
type StackEvent = {
  StackId: string
  EventId: string
  StackName: string
  LogicalResourceId: string
  PhysicalResourceId: string
  ResourceType: string
  Timestamp: string
  ResourceStatus: string
  ResourceStatusReason?: string
  ResourceProperties?: string
}

export default function getCurrentStackEvents(options: {
  cloudformation?: CloudFormation | null | undefined
  awsConfig?: ConfigurationOptions | null
  StackName: string
}): AsyncIterable<StackEvent>
