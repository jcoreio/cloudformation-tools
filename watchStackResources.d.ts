import { CloudFormation } from 'aws-sdk'

export default function watchStackResources(options: {
  delay?: number | null | undefined
  cloudformation?: CloudFormation | null | undefined
  StackName?: string | null | undefined
  StackNames?: string[] | null | undefined
  whilePending?: Promise<any> | null | undefined
}): NodeJS.Timeout
