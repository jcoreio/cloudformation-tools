/**
 * @flow
 * @prettier
 */

import AWS from 'aws-sdk'

type StackEvent = {
  StackId: string,
  EventId: string,
  StackName: string,
  LogicalResourceId: string,
  PhysicalResourceId: string,
  ResourceType: string,
  Timestamp: string,
  ResourceStatus: string,
  ResourceStatusReason?: string,
  ResourceProperties?: string,
}

export default async function* getCurrentStackEvents({
  cloudformation,
  StackName,
}: {
  cloudformation?: ?AWS.CloudFormation,
  StackName: string,
}): AsyncIterable<StackEvent> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation()
  let StackEvents, NextToken
  let count = 0
  do {
    const options = { StackName }
    if (NextToken) (options: any).NextToken = NextToken
    console.error('getting events', options) // eslint-disable-line no-console
    ;({ StackEvents, NextToken } = await cloudformation
      .describeStackEvents(options)
      .promise())
    console.error(`got ${StackEvents.length} events, NextToken:`, NextToken) // eslint-disable-line no-console
    for (let event of StackEvents) {
      if (
        'AWS::CloudFormation::Stack' === event.ResourceType &&
        /_COMPLETE$/.test(event.ResourceStatus) &&
        count > 0
      ) {
        return
      }
      count++
      yield event
    }
  } while (NextToken)
}
