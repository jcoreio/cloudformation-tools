import { CloudFormation } from 'aws-sdk'
import { ConfigurationOptions } from 'aws-sdk/lib/config'

export default function getStackOutputs(options: {
  cloudformation?: CloudFormation | null | undefined
  StackName: string
  region?: string | null | undefined
  awsConfig?: ConfigurationOptions | null
}): Promise<Record<string, string>>
