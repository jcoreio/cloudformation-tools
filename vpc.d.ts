import AWS from 'aws-sdk'

export function getVPCIdBySubnetId(options: {
  subnetId: string
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
}): Promise<string>
