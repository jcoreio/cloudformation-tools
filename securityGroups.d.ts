// @flow

import { EC2 } from 'aws-sdk'
import { ConfigurationOptions } from 'aws-sdk/lib/config'

export function getSecurityGroupId(options: {
  securityGroupName: string
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
  awsConfig?: ConfigurationOptions | null
  vpcId: string
}): Promise<string | null | undefined>

export function upsertSecurityGroup(options: {
  securityGroupName: string
  securityGroupDescription?: string | null | undefined
  vpcId: string
  ec2?: EC2 | null | undefined
  region?: string | null | undefined
  awsConfig?: ConfigurationOptions | null
}): Promise<{ securityGroupId: string }>
