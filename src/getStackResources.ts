import {
  CloudFormationClient,
  CloudFormationClientConfig,
  StackResourceSummary,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation'

export default async function getStackResources({
  cloudformation,
  awsConfig,
  StackName,
}: {
  cloudformation?: CloudFormationClient
  awsConfig?: CloudFormationClientConfig
  StackName: string
}): Promise<StackResourceSummary[]> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation)
    cloudformation = new CloudFormationClient(awsConfig || {})
  const resources: StackResourceSummary[] = []
  let StackResourceSummaries, NextToken
  do {
    const options = {
      StackName,
    } as const
    if (NextToken) (options as any).NextToken = NextToken
    ;({ StackResourceSummaries, NextToken } = await cloudformation.send(
      new ListStackResourcesCommand(options)
    ))
    StackResourceSummaries?.forEach((r) => resources.push(r))
  } while (NextToken)
  return resources
}
