import {
  DescribeSubnetsCommand,
  EC2Client,
  EC2ClientConfig,
  Subnet,
} from '@aws-sdk/client-ec2'

export async function getSubnetInfo({
  subnetId,
  ec2,
  region,
  awsConfig,
}: {
  subnetId: string
  ec2?: EC2Client
  region?: string
  awsConfig?: EC2ClientConfig
}): Promise<Subnet> {
  if (!subnetId) throw Error('subnetId is required')
  if (!awsConfig)
    awsConfig = {
      ...(region ?
        {
          region,
        }
      : {}),
    }
  if (!ec2) ec2 = new EC2Client(awsConfig)
  const { Subnets } = await ec2.send(
    new DescribeSubnetsCommand({
      SubnetIds: [subnetId],
    })
  )
  const subnet = Subnets ? Subnets[0] : undefined
  if (!subnet) throw Error(`subnet with ID ${subnetId} not found`)
  return subnet
}
