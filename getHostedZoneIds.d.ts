import { ConfigurationOptions } from 'aws-sdk/lib/config'

export default function getHostedZoneIds(options: {
  domain: string
  region?: String | null
  awsConfig?: ConfigurationOptions | null
}): Promise<{ publicZone: string; privateZone: string }>
