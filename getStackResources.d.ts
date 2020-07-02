import AWS from 'aws-sdk'

type StackResource = {
  LogicalResourceId: string
  PhysicalResourceId: string
  ResourceType: string
  LastUpdatedTimestamp: Date
  ResourceStatus: string
  ResourceStatusReason?: string
  DriftInformation: { StackResourceDriftStatus: string }
}

export default function getStackResources(options: {
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName: string
}): Promise<Array<StackResource>>
