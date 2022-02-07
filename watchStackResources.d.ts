import AWS from 'aws-sdk'

export default function watchStackResources(options: {
  delay?: number | null | undefined
  cloudformation?: AWS.CloudFormation | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
  StackName?: string | null | undefined
  StackNames?: string[] | null | undefined
  whilePending?: Promise<any> | null | undefined
}): NodeJS.Timeout
