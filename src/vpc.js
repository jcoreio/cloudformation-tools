// @flow

import AWS from 'aws-sdk'
import { getEC2 } from './ec2'

export async function getVPCIdBySubnetId({
  subnetId,
  ec2,
  region,
}: {
  subnetId: string,
  ec2?: ?AWS.EC2,
  region?: ?string,
}): Promise<string> {
  if (!subnetId) throw Error('subnetId is required')
  const { Subnets } = await getEC2({ ec2, region })
    .describeSubnets({
      SubnetIds: [subnetId],
    })
    .promise()
  const subnet = Subnets[0]
  if (!subnet) throw Error(`subnet with ID ${subnetId} not found`)
  return subnet.VpcId
}
