import AWS from 'aws-sdk'

export default function getHostedZoneIds(options: {
  domain: string
  region?: String | null
  awsConfig?: AWS.ConfigurationOptions | null
}): Promise<{ publicZone: string; privateZone: string }>
