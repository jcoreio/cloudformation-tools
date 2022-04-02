import AWS from 'aws-sdk'

export function getSubnetInfo(options: {
  subnetId: AWS.EC2.SubnetId
  ec2?: AWS.EC2 | undefined
  region?: string | undefined
  awsConfig?: AWS.ConfigurationOptions | null
}): Promise<AWS.EC2.Subnet>
