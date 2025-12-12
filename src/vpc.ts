import {
  DescribeVpcsCommand,
  EC2Client,
  EC2ClientConfig,
  Vpc,
} from '@aws-sdk/client-ec2'
import { getSubnetInfo } from './subnet'
export async function getVPCIdBySubnetId({
  subnetId,
  ec2,
  region,
  awsConfig,
}: {
  subnetId: string
  ec2?: EC2Client
  region?: string
  awsConfig?: EC2ClientConfig
}): Promise<string> {
  const { VpcId } = await getSubnetInfo({
    subnetId,
    ec2,
    awsConfig,
    region,
  })
  if (!VpcId) {
    throw new Error(`unexpected: Subnet reponse is missing VpcId`)
  }
  return VpcId
}
export async function getCIDRByVPCId({
  vpcId,
  ec2,
  region,
  awsConfig,
}: {
  vpcId: string
  ec2?: EC2Client
  region?: string
  awsConfig?: EC2ClientConfig
}): Promise<string> {
  if (!vpcId) throw Error('vpcId is required')
  if (!awsConfig)
    awsConfig = {
      ...(region ?
        {
          region,
        }
      : {}),
    }
  if (!ec2) ec2 = new EC2Client(awsConfig)
  const { Vpcs } = await ec2.send(
    new DescribeVpcsCommand({
      VpcIds: [vpcId],
    })
  )
  if (!Vpcs) throw Error('missing Vpcs in result')
  const vpc = Vpcs[0] as Vpc | undefined
  if (!vpc)
    throw Error(
      `could not look up CIDR for VPC ${vpcId}: missing VPC in result`
    )
  const { CidrBlock } = vpc
  if (!CidrBlock)
    throw Error(
      `could not look up CIDR for VPC ${vpcId}: missing CidrBlock on VPC object`
    )
  return CidrBlock
}
