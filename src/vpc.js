// @flow

import AWS from 'aws-sdk'
import { getSubnetInfo } from './subnet'

export async function getVPCIdBySubnetId({
  subnetId,
  ec2,
  region,
}: {
  subnetId: string,
  ec2?: ?AWS.EC2,
  region?: ?string,
}): Promise<string> {
  return (await getSubnetInfo({ subnetId, ec2, region })).VpcId
}
