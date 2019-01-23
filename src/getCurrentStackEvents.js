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

export default async function getCurrentStackEvents({
  cloudformation,
  StackName,
}: {
  cloudformation?: ?AWS.CloudFormation,
  StackName: string,
}): Promise<Array<StackEvent>> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation()
  const events = []
  let StackEvents, NextToken
  let count = 0
  do {
    const options = { StackName }
    if (NextToken) (options: any).NextToken = NextToken
    ;({ StackEvents, NextToken } = await cloudformation
      .describeStackEvents(options)
      .promise())
    for (let event of StackEvents) {
      if (
        'AWS::CloudFormation::Stack' === event.ResourceType &&
        /_COMPLETE$/.test(event.ResourceStatus) &&
        count > 0
      ) {
        return events
      }
      count++
      events.push(event)
    }
  } while (NextToken)
  return events
}
