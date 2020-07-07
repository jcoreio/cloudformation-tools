import AWS from 'aws-sdk'

type Options = {
  interval: number
  region?: string | null | undefined
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
