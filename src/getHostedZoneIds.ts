import {
  HostedZone,
  Route53Client,
  Route53ClientConfig,
  ListHostedZonesByNameCommand,
} from '@aws-sdk/client-route-53'

function extractId(zone?: HostedZone): string | undefined {
  const id = zone?.Id
  return id ? id.substring(id.lastIndexOf('/') + 1) : undefined
}

export default async function getHostedZoneIds({
  domain,
  region,
  awsConfig,
}: {
  domain?: string
  region: string
  awsConfig?: Route53ClientConfig
}): Promise<{ publicZone: string; privateZone: string }> {
  if (!domain) throw Error(`domain is required`)
  const domainClean =
    domain.endsWith('.') ? domain.substring(0, domain.length - 1) : domain
  if (!domainClean) throw Error(`domain must not be just a trailing dot`)
  if (!awsConfig) awsConfig = { ...(region ? { region } : {}) }
  const { HostedZones } = await new Route53Client(awsConfig).send(
    new ListHostedZonesByNameCommand({
      DNSName: domainClean,
      MaxItems: 2,
    })
  )
  // DNSName above is a pagination parameter, not a filtering parameter. So we still
  // need to match the domain name. The returned domain names are suffixed with dots.
  const thisDomainZones = HostedZones?.filter(
    ({ Name }) => Name === `${domainClean}.`
  )
  const publicZone = extractId(
    thisDomainZones?.find(({ Config }) => !Config?.PrivateZone)
  )
  const privateZone = extractId(
    thisDomainZones?.find(({ Config }) => Config?.PrivateZone)
  )
  if (!publicZone || !privateZone) {
    throw Error(
      `${[...(publicZone ? [] : ['public zone not found']), ...(privateZone ? [] : ['private zone not found'])].join(', ')} for domain ${domain}. Zones: ${JSON.stringify(
        HostedZones,
        null,
        2
      )}`
    )
  }
  return { publicZone, privateZone }
}
