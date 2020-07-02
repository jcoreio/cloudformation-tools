import AWS from 'aws-sdk'

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
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName: string
}): AsyncIterable<StackEvent>
