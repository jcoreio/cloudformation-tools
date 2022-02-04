import * as AWS from 'aws-sdk'
import { ConfigurationOptions } from 'aws-sdk/lib/config'

type Options = {
  interval: number
  region?: string | null | undefined
  awsConfig?: ConfigurationOptions | null
  cloudformation?: AWS.CloudFormation | null | undefined
}

export default class StackResourceWatcher {
  private _StackNames: string[]
  private _options: Options
  private _intervalID: NodeJS.Timeout | null

  constructor(options: Options)

  addStackName(StackName: string): void
  removeStackName(StackName: string): void
  start(): void
  stop(): void
  private _update: () => void
}
