import { CloudFormation } from 'aws-sdk'
import { ConfigurationOptions } from 'aws-sdk/lib/config'

export default function watchStackResources(options: {
  delay?: number | null | undefined
  cloudformation?: CloudFormation | null | undefined
  awsConfig?: ConfigurationOptions | null
  StackName?: string | null | undefined
  StackNames?: string[] | null | undefined
  whilePending?: Promise<any> | null | undefined
}): NodeJS.Timeout
