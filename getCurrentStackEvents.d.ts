import AWS from 'aws-sdk'

export default function getCurrentStackEvents(options: {
  cloudformation?: AWS.CloudFormation | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
  StackName: AWS.CloudFormation.StackName
}): AsyncIterable<AWS.CloudFormation.StackEvent>
