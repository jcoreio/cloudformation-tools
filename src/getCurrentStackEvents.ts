import AWS from 'aws-sdk'

export function isRootStackEvent(
  event: AWS.CloudFormation.StackEvent
): boolean {
  return (
    event.ResourceType === 'AWS::CloudFormation::Stack' &&
    event.StackName === event.LogicalResourceId &&
    event.PhysicalResourceId === event.StackId
  )
}
export default async function* getCurrentStackEvents({
  awsConfig,
  cloudformation,
  StackName,
  since,
  signal,
}: {
  awsConfig?: AWS.ConfigurationOptions
  cloudformation?: AWS.CloudFormation | undefined
  StackName: string
  since?: number | Date
  signal?: AbortSignal
}): AsyncIterable<AWS.CloudFormation.StackEvent> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation(awsConfig || {})
  let StackEvents: AWS.CloudFormation.StackEvents | undefined,
    NextToken: string | undefined
  let count = 0
  do {
    const options = {
      StackName,
    } as const
    if (NextToken) (options as any).NextToken = NextToken
    ;({ StackEvents, NextToken } = await cloudformation
      .describeStackEvents(options)
      .promise())
    for (const event of StackEvents || []) {
      if (
        (isRootStackEvent(event) &&
          !event.ResourceStatus?.includes('IN_PROGRESS') &&
          count > 0) ||
        (since != null && event.Timestamp <= since)
      ) {
        return
      }
      if (event.Timestamp) count++
      yield event
    }
  } while (NextToken && !signal?.aborted)
}
