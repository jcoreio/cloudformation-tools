export default function getHostedZoneIds(options: {
  domain: string
  region: String
}): Promise<{ publicZone: string; privateZone: string }>
