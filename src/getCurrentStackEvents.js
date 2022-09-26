/**
 * @flow
 * @prettier
 */

import AWS from 'aws-sdk'

export type StackEvent = {
  StackId: string,
  EventId: string,
  StackName: string,
  LogicalResourceId: string,
  PhysicalResourceId: string,
  ResourceType: string,
  Timestamp: Date,
  ResourceStatus: string,
  ResourceStatusReason?: string,
  ResourceProperties?: string,
}

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
  awsConfig?: ?{ ... },
  cloudformation?: ?AWS.CloudFormation,
  StackName: string,
  since?: number | Date,
  signal?: AbortSignal,
}): AsyncIterable<StackEvent> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation(awsConfig || {})
  let StackEvents, NextToken
  let count = 0
  do {
    const options = { StackName }
    if (NextToken) (options: any).NextToken = NextToken
    ;({ StackEvents, NextToken } = await cloudformation
      .describeStackEvents(options)
      .promise())
    for (const event: StackEvent of StackEvents) {
      if (
        (isRootStackEvent(event) &&
          !event.ResourceStatus.includes('IN_PROGRESS') &&
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
