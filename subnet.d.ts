export type SubnetInfo = {
  AvailabilityZone: string
  AvailabilityZoneId: string
  AvailableAddressCount: number
  CidrBlock: string
  DefaultForAz: boolean
  MapPublicIpOnLaunch: boolean
  MapCustomerOwnedIpOnLaunch: boolean
  CustomerOwnedIpv4Pool: string
  State: 'pending' | 'available'
  SubnetId: string
  VpcId: string
  OwnerId: string
  AssignIpv6AddressOnCreation: boolean
  Tags: Array<{ Key: string; Value: string }>
  SubnetArn: string
  OutpostArn: string
}

export function getSubnetInfo({
  subnetId,
  ec2,
  region,
}: {
  subnetId: string
  ec2?: AWS.EC2 | undefined
  region?: string | undefined
}): Promise<SubnetInfo>
