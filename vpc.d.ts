import AWS from 'aws-sdk'

export function getVPCIdBySubnetId(options: {
  subnetId: AWS.EC2.SubnetId
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
}): Promise<AWS.EC2.VpcId>
