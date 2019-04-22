'use strict'

import AWS from 'aws-sdk'

function extractId(id: string): string {
  return id.substring(id.lastIndexOf('/') + 1)
}

export default async function getHostedZoneIds({
  domain,
  region,
}: {
  domain: string,
  region: String,
}): Promise<{ publicZone: string, privateZone: string }> {
  if (!domain) throw Error(`domain is required`)
  const { HostedZones } = await new AWS.Route53({ region })
    .listHostedZonesByName({
      DNSName: domain,
    })
    .promise()
  let publicZone = null
  let privateZone = null
  HostedZones.forEach(({ Config, Id }) => {
    if (!Config) return
    if (Config.PrivateZone === true) {
      privateZone = extractId(Id)
    } else {
      publicZone = extractId(Id)
    }
  })
  if (!publicZone)
    throw new Error(
      `Public zone not found in ${JSON.stringify(HostedZones, null, 2)}`
    )
  if (!privateZone)
    throw new Error(
      `Private zone not found in ${JSON.stringify(HostedZones, null, 2)}`
    )
  return { publicZone, privateZone }
}
