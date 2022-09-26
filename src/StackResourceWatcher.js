/**
 * @prettier
 * @flow
 */

import { pull } from 'lodash'

import getStackResources, { type StackResource } from './getStackResources'
import ansi from 'ansi-escapes'
import chalk from 'chalk'
import printStackResources from './printStackResources'

import AWS from 'aws-sdk'

type Options = {
  interval: number,
  region?: ?string,
  awsConfig?: ?{ ... },
  cloudformation?: ?AWS.CloudFormation,
  /**
   * Whether to clear the screen each time resource states are printed (defaults to false).
   */
  clearScreen?: boolean,
}

export default class StackResourceWatcher {
  _StackNames: Array<string> = []
  _options: Options
  _intervalID: ?IntervalID = null
  _linesWritten: number = 0

  constructor(options: Options) {
    this._options = options
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
      return
    }
    this._intervalID = setInterval(this._update, this._options.interval)
    this._update()
  }
  stop() {
    if (this._intervalID == null) {
      return
    }
    clearInterval(this._intervalID)
    this._intervalID = null
  }

  _update = async () => {
    if (this._intervalID == null) return

    const StackNames = this._StackNames
    const { awsConfig, cloudformation, clearScreen } = this._options

    const stackResources: {
      resources?: StackResource[],
      error?: Error,
    }[] = await Promise.all(
      StackNames.map(
        async (
          StackName: string
        ): {
          resources?: StackResource[],
          error?: Error,
        } => {
          try {
            const resources = await getStackResources({
              cloudformation,
              awsConfig,
              StackName,
            })
            return { resources }
          } catch (error) {
            return { error }
          }
        }
      )
    )
    if (clearScreen !== false) {
      process.stderr.write(ansi.eraseLines(this._linesWritten + 1))
    }
    this._linesWritten = 0
    for (let i = 0; i < StackNames.length; i++) {
      if (!stackResources[i]) continue
      const { resources, error } = stackResources[i]
      process.stderr.write(
        chalk`${i > 0 ? '\n' : ''}{bold ${StackNames[i]}}:\n\n`
      )
      this._linesWritten += i > 0 ? 3 : 2
      if (error) {
        process.stderr.write(
          chalk.red(`Failed to get stack resources: ${error.message}\n\n`)
        )
        this._linesWritten += 1 + error.message.split(/\n/gm).length
      }
      if (!Array.isArray(resources)) continue
      printStackResources({ resources })
      this._linesWritten += resources.length + 1
    }
    process.stderr.write(new Date().toString() + '\n')
    this._linesWritten++
  }
}
