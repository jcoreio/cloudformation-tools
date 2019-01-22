/**
 * @flow
 * @prettier
 */

import AWS from 'aws-sdk'

type StackResource = {
  LogicalResourceId: string,
  PhysicalResourceId: string,
  ResourceType: string,
  LastUpdatedTimestamp: Date,
  ResourceStatus: string,
  ResourceStatusReason?: string,
  DriftInformation: { StackResourceDriftStatus: string },
}

export default async function getStackResources({
  cloudformation,
  StackName,
}: {
  cloudformation?: ?AWS.CloudFormation,
  StackName: string,
}): Promise<Array<StackResource>> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation()
  const resources = []
  let StackResourceSummaries, NextToken
  do {
    const options = { StackName }
    if (NextToken) (options: any).NextToken = NextToken
    ;({
      StackResourceSummaries,
      NextToken,
    } = await cloudformation.listStackResources(options).promise())
    resources.push(...StackResourceSummaries)
  } while (NextToken)
  return resources
}
