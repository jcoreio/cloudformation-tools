'use strict'

import AWS from 'aws-sdk'

function extractId(zone: ?Object): ?string {
  const id = zone && zone.Id
  return id ? id.substring(id.lastIndexOf('/') + 1) : null
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
    .listHostedZonesByName()
    .promise()
  // domain names in result set are suffixed with dots
  const searchDomain = domain.endsWith('.') ? domain : `${domain}.`
  const thisDomainZones = HostedZones.filter(
    ({ Name }) => Name === searchDomain
  )
  const publicZone = extractId(
    thisDomainZones.find(({ Config }) => !Config.PrivateZone)
  )
  const privateZone = extractId(
    thisDomainZones.find(({ Config }) => Config.PrivateZone)
  )
  const errors = []
  if (!publicZone) errors.push('public zone not found')
  if (!privateZone) errors.push('private zone not found')
  if (errors.length)
    throw Error(
      `${errors.join(', ')} for domain ${domain}. Zones: ${JSON.stringify(
        HostedZones,
        null,
        2
      )}`
    )
  return { publicZone, privateZone }
}
