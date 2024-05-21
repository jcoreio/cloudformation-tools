import AWS from 'aws-sdk'

export async function getSubnetInfo({
  subnetId,
  ec2,
  region,
  awsConfig,
}: {
  subnetId: string
  ec2?: AWS.EC2
  region?: string
  awsConfig?: AWS.ConfigurationOptions
}): Promise<AWS.EC2.Subnet> {
  if (!subnetId) throw Error('subnetId is required')
  if (!awsConfig)
    awsConfig = {
      ...(region
        ? {
            region,
          }
        : {}),
    }
  if (!ec2) ec2 = new AWS.EC2(awsConfig)
  const { Subnets } = await ec2
    .describeSubnets({
      SubnetIds: [subnetId],
    })
    .promise()
  const subnet = Subnets ? Subnets[0] : undefined
  if (!subnet) throw Error(`subnet with ID ${subnetId} not found`)
  return subnet
}
