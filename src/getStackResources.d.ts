import AWS from 'aws-sdk'

export default function getStackResources(options: {
  cloudformation?: AWS.CloudFormation | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
  StackName: AWS.CloudFormation.StackName
}): Promise<Array<AWS.CloudFormation.StackResource>>
