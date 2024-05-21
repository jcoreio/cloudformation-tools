import {
  CloudFormationClient,
  CloudFormationClientConfig,
  DescribeStackEventsCommand,
  StackEvent,
} from '@aws-sdk/client-cloudformation'

export function isRootStackEvent(event: StackEvent): boolean {
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
  awsConfig?: CloudFormationClientConfig
  cloudformation?: CloudFormationClient
  StackName: string
  since?: number | Date
  signal?: AbortSignal
}): AsyncIterable<StackEvent> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation)
    cloudformation = new CloudFormationClient(awsConfig || {})
  let StackEvents: StackEvent[] | undefined, NextToken: string | undefined
  let count = 0
  do {
    const options = {
      StackName,
    } as const
    if (NextToken) (options as any).NextToken = NextToken
    ;({ StackEvents, NextToken } = await cloudformation.send(
      new DescribeStackEventsCommand(options)
    ))
    for (const event of StackEvents || []) {
      if (
        (isRootStackEvent(event) &&
          !event.ResourceStatus?.includes('IN_PROGRESS') &&
          count > 0) ||
        (since != null && event.Timestamp != null && event.Timestamp <= since)
      ) {
        return
      }
      if (event.Timestamp) count++
      yield event
    }
  } while (NextToken && !signal?.aborted)
}
