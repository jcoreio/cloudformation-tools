// @flow

import AWS from 'aws-sdk'

export type SubnetInfo = {
  AvailabilityZone: string,
  AvailabilityZoneId: string,
  AvailableAddressCount: number,
  CidrBlock: string,
  DefaultForAz: boolean,
  MapPublicIpOnLaunch: boolean,
  MapCustomerOwnedIpOnLaunch: boolean,
  CustomerOwnedIpv4Pool: string,
  State: 'pending' | 'available',
  SubnetId: string,
  VpcId: string,
  OwnerId: string,
  AssignIpv6AddressOnCreation: boolean,
  Tags: Array<{ Key: string, Value: string }>,
  SubnetArn: string,
  OutpostArn: string,
}

export async function getSubnetInfo({
  subnetId,
  ec2,
  region,
  awsConfig,
}: {
  subnetId: string,
  ec2?: ?AWS.EC2,
  region?: ?string,
  awsConfig?: ?{ ... },
}): Promise<SubnetInfo> {
  if (!subnetId) throw Error('subnetId is required')
  if (!awsConfig) awsConfig = { ...(region ? { region } : {}) }
  if (!ec2) ec2 = new AWS.EC2(awsConfig)
  const { Subnets } = ec2
    .describeSubnets({
      SubnetIds: [subnetId],
    })
    .promise()
  const subnet = Subnets[0]
  if (!subnet) throw Error(`subnet with ID ${subnetId} not found`)
  return subnet
}
