// @flow

import AWS from 'aws-sdk'

export function getEC2({
  ec2,
  region,
}: {
  ec2?: ?AWS.EC2,
  region?: ?string,
}): AWS.EC2 {
  if (ec2) return ec2
  if (!region) throw Error('either ec2 or region must be provided')
  return new AWS.EC2({ region })
}
