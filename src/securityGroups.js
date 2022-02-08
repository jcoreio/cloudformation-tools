// @flow

import AWS from 'aws-sdk'
import { VError } from 'verror'

export async function getSecurityGroupId({
  securityGroupName,
  ec2,
  region,
  awsConfig,
  vpcId,
}: {
  securityGroupName: string,
  ec2?: ?AWS.EC2,
  region?: ?string,
  awsConfig?: ?{ ... },
  vpcId: string,
}): Promise<?string> {
  if (!vpcId) throw Error('vpcId is required')
  if (!awsConfig) awsConfig = { ...(region ? { region } : {}) }
  if (!ec2) ec2 = new AWS.EC2(awsConfig)
  let securityGroups = []
  try {
    securityGroups = ec2.SecurityGroups
  } catch (err) {
    if ('InvalidGroup.NotFound' !== err.code)
      throw new VError(
        err,
        `could not fetch security group ID for security group name ${securityGroupName} in VPC ${vpcId}`
      )
  }
  return securityGroups && securityGroups[0] ? securityGroups[0].GroupId : null
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
  securityGroupName: string,
  securityGroupDescription?: ?string,
  vpcId: string,
  ec2?: ?AWS.EC2,
  region?: ?string,
  awsConfig?: ?{ ... },
}): Promise<{ securityGroupId: string }> {
  if (!awsConfig) awsConfig = { ...(region ? { region } : {}) }
  if (!ec2) ec2 = new AWS.EC2(awsConfig)
  let securityGroupId = await getSecurityGroupId({
    securityGroupName,
    ec2,
    awsConfig,
    vpcId,
  })
  if (!securityGroupId) {
    // eslint-disable-next-line no-console
    console.log(`creating ${securityGroupName} security group...`)
    securityGroupId = (await ec2
      .createSecurityGroup({
        Description: securityGroupDescription || '',
        GroupName: securityGroupName,
        VpcId: vpcId,
      })
      .promise()).GroupId
  }
  return { securityGroupId }
}
