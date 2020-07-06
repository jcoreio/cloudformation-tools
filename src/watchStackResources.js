#!/usr/bin/env node
/**
 * @flow
 * @prettier
 */

import AWS from 'aws-sdk'
import getStackResources from './getStackResources'
import printStackResources from './printStackResources'
import ansi from 'ansi-escapes'
import chalk from 'chalk'

export default function watchStackResources({
  delay,
  cloudformation,
  StackName,
  StackNames: _StackNames,
  whilePending,
}: {
  delay?: ?number,
  cloudformation?: ?AWS.CloudFormation,
  StackName?: ?string,
  StackNames?: ?Array<string>,
  whilePending?: ?Promise<any>,
}): IntervalID {
  const StackNames = ((): Array<string> => {
    if (_StackNames) return _StackNames
    if (StackName) return [StackName]
    throw new Error('StackName or StackNames must be provided')
  })()
  if (!StackNames.length) throw new Error('StackNames must not be empty')
  if (!cloudformation) cloudformation = new AWS.CloudFormation()
  const interval = setInterval(onInterval, delay || 5000)
  async function onInterval() {
    const resources = await Promise.all(
      StackNames.map(StackName =>
        getStackResources({ cloudformation, StackName })
      )
    )
    process.stderr.write(ansi.clearScreen)
    process.stderr.write(ansi.cursorTo(0, 0))
    for (let i = 0; i < StackNames.length; i++) {
      if (StackNames.length > 1) {
        process.stderr.write(
          chalk`${i > 0 ? '\n' : ''}{bold ${StackNames[i]}}:\n\n`
        )
      }
      printStackResources({ resources: resources[i] })
    }
    process.stderr.write(new Date().toString() + '\n')
  }
  onInterval()
  if (whilePending) whilePending.finally(() => clearInterval(interval))
  return interval
}

if (!module.parent)
  watchStackResources({ StackNames: process.argv[2].split(/,/g) })
