#!/usr/bin/env node
/**
 * @flow
 * @prettier
 */

import AWS from 'aws-sdk'
import getStackResources from './getStackResources'
import printStackResources from './printStackResources'
import ansi from 'ansi-escapes'

export default function watchStackResources({
  delay,
  cloudformation,
  StackName,
}: {
  delay?: ?number,
  cloudformation?: ?AWS.CloudFormation,
  StackName: string,
}): IntervalID {
  if (!StackName) throw new Error('missing StackName')
  if (!cloudformation) cloudformation = new AWS.CloudFormation()
  const interval = setInterval(onInterval, delay || 5000)
  async function onInterval() {
    const resources = await getStackResources({ cloudformation, StackName })
    process.stderr.write(ansi.clearScreen)
    process.stderr.write(ansi.cursorTo(0, 0))
    printStackResources({ resources })
    process.stderr.write(new Date().toString() + '\n')
  }
  onInterval()
  return interval
}

if (!module.parent) watchStackResources({ StackName: process.argv[2] })
