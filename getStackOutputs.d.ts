import AWS from 'aws-sdk'

export default function getStackOutputs(options: {
  cloudformation?: AWS.CloudFormation | null | undefined
  StackName: AWS.CloudFormation.StackName
  region?: string | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
}): Promise<
  Record<AWS.CloudFormation.OutputKey, AWS.CloudFormation.OutputValue>
>
