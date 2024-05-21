// @flow

import AWS from 'aws-sdk'

export function getSecurityGroupId(options: {
  securityGroupName: AWS.EC2.SecurityGroupName
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
  vpcId: string
}): Promise<AWS.EC2.SecurityGroupId>

export function upsertSecurityGroup(options: {
  securityGroupName: AWS.EC2.SecurityGroupName
  securityGroupDescription?: string | null | undefined
  vpcId: AWS.EC2.VpcId
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
  awsConfig?: AWS.ConfigurationOptions | null
}): Promise<{ securityGroupId: AWS.EC2.SecurityGroupId }>
