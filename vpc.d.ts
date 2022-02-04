import * as AWS from 'aws-sdk'
import { ConfigurationOptions } from 'aws-sdk/lib/config'

export function getVPCIdBySubnetId(options: {
  subnetId: string
  ec2?: AWS.EC2 | null | undefined
  region?: string | null | undefined
  awsConfig?: ConfigurationOptions | null
}): Promise<string>
