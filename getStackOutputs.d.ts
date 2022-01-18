import { CloudFormation } from 'aws-sdk'

export default function getStackOutputs(options: {
  cloudformation?: CloudFormation | null | undefined
  StackName: string
  region?: string | null | undefined
}): Promise<Record<string, string>>
