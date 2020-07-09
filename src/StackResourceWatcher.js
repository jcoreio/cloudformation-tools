/**
 * @prettier
 * @flow
 */

import { pull } from 'lodash'

import getStackResources from './getStackResources'
import ansi from 'ansi-escapes'
import chalk from 'chalk'
import printStackResources from './printStackResources'

import AWS from 'aws-sdk'

type Options = {
  interval: number,
  region?: ?string,
  cloudformation?: ?AWS.CloudFormation,
}

export default class StackResourceWatcher {
  _StackNames: Array<string> = []
  _options: Options
  _cloudformation: AWS.CloudFormation
  _intervalID: ?IntervalID = null

  constructor(options: Options) {
    this._options = options
    const { region } = options
    this._cloudformation =
      options.cloudformation || new AWS.CloudFormation({ region })
  }

  addStackName(StackName: string) {
    if (this._StackNames.includes(StackName)) return
    this._StackNames.push(StackName)
    if (this._intervalID == null) this.start()
    else this._update()
  }
  removeStackName(StackName: string) {
    if (!this._StackNames.includes(StackName)) return
    pull(this._StackNames, StackName)
    if (this._intervalID != null) this._update()
    if (!this._StackNames.length) this.stop()
  }

  start() {
    if (this._intervalID != null) {
      throw new Error('already running')
    }
    this._intervalID = setInterval(this._update, this._options.interval)
    this._update()
  }
  stop() {
    if (this._intervalID == null) {
      throw new Error('not running')
    }
    clearInterval(this._intervalID)
    this._intervalID = null
  }

  _update = async () => {
    if (this._intervalID == null) return

    const StackNames = this._StackNames
    const cloudformation = this._cloudformation

    const resources = await Promise.all(
      StackNames.map(StackName =>
        getStackResources({ cloudformation, StackName })
      )
    )
    process.stderr.write(ansi.clearScreen)
    process.stderr.write(ansi.cursorTo(0, 0))
    for (let i = 0; i < StackNames.length; i++) {
      process.stderr.write(
        chalk`${i > 0 ? '\n' : ''}{bold ${StackNames[i]}}:\n\n`
      )
      printStackResources({ resources: resources[i] })
    }
    process.stderr.write(new Date().toString() + '\n')
  }
}
