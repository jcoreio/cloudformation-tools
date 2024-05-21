import AWS from 'aws-sdk'

export default async function getStackResources({
  cloudformation,
  awsConfig,
  StackName,
}: {
  cloudformation?: AWS.CloudFormation | undefined
  awsConfig?: AWS.ConfigurationOptions
  StackName: string
}): Promise<AWS.CloudFormation.StackResourceSummaries> {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation(awsConfig || {})
  const resources: AWS.CloudFormation.StackResourceSummaries = []
  let StackResourceSummaries, NextToken
  do {
    const options = {
      StackName,
    } as const
    if (NextToken) (options as any).NextToken = NextToken
    ;({ StackResourceSummaries, NextToken } = await cloudformation
      .listStackResources(options)
      .promise())
    StackResourceSummaries?.forEach((r) => resources.push(r))
  } while (NextToken)
  return resources
}
