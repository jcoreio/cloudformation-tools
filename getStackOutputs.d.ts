import AWS from 'aws-sdk'

export default function getStackOutputs(options: {
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName: string
  region?: string | null | undefined
}): Promise<Record<string, string>>
