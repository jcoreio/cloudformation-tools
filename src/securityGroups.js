// @flow

import AWS from 'aws-sdk'

import { VError } from 'verror'

import { getEC2 } from './ec2'

export async function getSecurityGroupId({
  securityGroupName,
  ec2,
  region,
  vpcId,
}: {
  securityGroupName: string,
  ec2?: ?AWS.EC2,
  region?: ?string,
  vpcId: string,
}): Promise<?string> {
  if (!vpcId) throw Error('vpcId is required')
  let securityGroups = []
  try {
    securityGroups = (await getEC2({ ec2, region })
      .describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
        GroupNames: [securityGroupName],
      })
      .promise()).SecurityGroups
  } catch (err) {
    if ('InvalidGroup.NotFound' !== err.code)
      throw new VError(
        err,
        `could not fetch security group ID for security group name ${securityGroupName} in VPC ${vpcId}`
      )
  }
  return securityGroups[0] ? securityGroups[0].GroupId : null
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
}: {
  securityGroupName: string,
  securityGroupDescription?: ?string,
  vpcId: string,
  ec2?: ?AWS.EC2,
  region?: ?string,
}): Promise<{ securityGroupId: string }> {
  const ec2Final = getEC2({ ec2, region })
  let securityGroupId = await getSecurityGroupId({
    securityGroupName,
    ec2: ec2Final,
    vpcId,
  })
  if (!securityGroupId) {
    // eslint-disable-next-line no-console
    console.log(`creating ${securityGroupName} security group...`)
    securityGroupId = (await ec2Final
      .createSecurityGroup({
        Description: securityGroupDescription || '',
        GroupName: securityGroupName,
        VpcId: vpcId,
      })
      .promise()).GroupId
  }
  return { securityGroupId }
}
