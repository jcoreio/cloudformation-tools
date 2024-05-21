import {
  CreateSecurityGroupCommand,
  DescribeSecurityGroupsCommand,
  EC2Client,
  EC2ClientConfig,
  SecurityGroup,
} from '@aws-sdk/client-ec2'
import { VError } from 'verror'

export async function getSecurityGroupId({
  securityGroupName,
  ec2,
  region,
  awsConfig,
  vpcId,
}: {
  securityGroupName: string
  ec2?: EC2Client
  region?: string
  awsConfig?: EC2ClientConfig
  vpcId: string
}): Promise<string | undefined> {
  if (!vpcId) throw Error('vpcId is required')
  if (!awsConfig)
    awsConfig = {
      ...(region
        ? {
            region,
          }
        : {}),
    }
  if (!ec2) ec2 = new EC2Client(awsConfig)
  let securityGroups: SecurityGroup[] = []
  try {
    securityGroups =
      (
        await ec2.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              {
                Name: 'group-name',
                Values: [securityGroupName],
              },
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
            ],
          })
        )
      ).SecurityGroups || []
  } catch (err: any) {
    if ('InvalidGroup.NotFound' !== err.code)
      throw new VError(
        err,
        `could not fetch security group ID for security group name ${securityGroupName} in VPC ${vpcId}`
      )
  }
  return securityGroups[0] ? securityGroups[0].GroupId : undefined
}

/**
 *
 * @param securityGroupName
 * @param securityGroupDescription
 * @param ec2
 * @param region
 * @param vpcId
 * @returns {Promise<{securityGroupId: *}>}
 */
export async function upsertSecurityGroup({
  securityGroupName,
  securityGroupDescription,
  vpcId,
  ec2,
  region,
  awsConfig,
}: {
  securityGroupName: string
  securityGroupDescription?: string
  vpcId: string
  ec2?: EC2Client
  region?: string
  awsConfig?: EC2ClientConfig
}): Promise<{
  securityGroupId: string
}> {
  if (!awsConfig)
    awsConfig = {
      ...(region
        ? {
            region,
          }
        : {}),
    }
  if (!ec2) ec2 = new EC2Client(awsConfig)
  let securityGroupId = await getSecurityGroupId({
    securityGroupName,
    ec2,
    vpcId,
  })
  if (!securityGroupId) {
    // eslint-disable-next-line no-console
    console.error(`creating ${securityGroupName} security group...`)
    securityGroupId = (
      await ec2.send(
        new CreateSecurityGroupCommand({
          Description: securityGroupDescription || '',
          GroupName: securityGroupName,
          VpcId: vpcId,
        })
      )
    ).GroupId
  }
  if (!securityGroupId) {
    throw new Error(`unexpected: failed to get GroupId of security group`)
  }
  return {
    securityGroupId,
  }
}
