// @flow

import AWS from 'aws-sdk'

export function getSecurityGroupId(options: {
  securityGroupName: string
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
  vpcId: string
}): Promise<string | null | undefined>

export function upsertSecurityGroup(options: {
  securityGroupName: string
  securityGroupDescription?: string | null | undefined
  vpcId: string
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
}): Promise<{ securityGroupId: string }>
