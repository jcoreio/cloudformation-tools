import AWS from 'aws-sdk'

export default function getCurrentStackEvents(options: {
  cloudformation?: AWS.CloudFormation | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
  StackName: AWS.CloudFormation.StackName
  since?: number | Date
  signal?: AbortSignal
}): AsyncIterable<AWS.CloudFormation.StackEvent>
