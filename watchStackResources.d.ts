import AWS from 'aws-sdk'

export default function watchStackResources(options: {
  delay?: number | null | undefined
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName?: string
  StackNames?: string[]
}): NodeJS.Timeout
