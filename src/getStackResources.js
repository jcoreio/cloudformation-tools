/**
 * @flow
 * @prettier
 */

import AWS from 'aws-sdk'

export type StackResource = {
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
  awsConfig,
  StackName,
}: {
  cloudformation?: ?AWS.CloudFormation,
  awsConfig?: ?{ ... },
  StackName: string,
}): Promise<Array<StackResource>> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation(awsConfig || {})
  const resources = []
  let StackResourceSummaries, NextToken
  do {
    const options = { StackName }
    if (NextToken) (options: any).NextToken = NextToken
    ;({ StackResourceSummaries, NextToken } = await cloudformation
      .listStackResources(options)
      .promise())
    resources.push(...StackResourceSummaries)
  } while (NextToken)
  return resources
}
