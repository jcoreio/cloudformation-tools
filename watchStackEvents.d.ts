/**
 * @prettier
 * @flow
 */
import AWS from 'aws-sdk'

export default function watchStackEvents(options: {
  awsConfig?: AWS.ConfigurationOptions | null
  cloudformation?: AWS.CloudFormation | null
  StackName: string
  since?: number | Date
  maxAttempts?: number
  backoff?: number
  pollDelay?: number
  signal?: AbortSignal
}): AsyncIterator<AWS.CloudFormation.StackEvent>
