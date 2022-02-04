import { ConfigurationOptions } from 'aws-sdk/lib/config'

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

export function getSubnetInfo(options: {
  subnetId: string
  ec2?: AWS.EC2 | undefined
  region?: string | undefined
  awsConfig?: ConfigurationOptions | null
}): Promise<SubnetInfo>
