// @flow

import chalk from 'chalk'
import {padEnd} from 'lodash'
import getCurrentStackEvents from './getCurrentStackEvents'

function wrapString(str: string, width: number): Array<string> {
  if (!str) return []
  const result = []
  let start = 0
  while (start < str.length) {
    let end = start + width
    for (let ws = end; ws > start + width / 2; ws--) {
      if (/\s/.test(str[ws])) {
        end = ws
        break
      }
    }
    result.push(str.substring(start, end))
    start = /\s/.test(str[end]) ? end + 1 : end
  }
  return result
}

async function describeCloudFormationFailure(stackName: string): Promise<void> {
  const padding = 25

  for (let event of await getCurrentStackEvents(stackName)) {
    if (!/(CREATE|UPDATE)_FAILED/.test(event.ResourceStatus)) continue
    console.error(padEnd('ResourceStatus', padding), chalk.red(event.ResourceStatus))
    console.error(padEnd('ResourceType', padding), event.ResourceType)
    for (let field of [
      'LogicalResourceId',
      'PhysicalResourceId',
    ]) {
      console.error(padEnd(field, padding), chalk.bold(event[field]))
    }
    console.error('ResourceStatusReason')
    // $FlowFixMe: process.stdout.columns is a valid property
    for (let line of wrapString(event.ResourceStatusReason, Math.min(80, process.stdout.columns - 2))) {
      console.error(' ', chalk.bold(line))
    }
    const {ResourceProperties} = event
    if (ResourceProperties) {
      const parsed = JSON.parse(ResourceProperties)
      console.error('ResourceProperties')
      for (let prop in parsed) {
        console.error(' ', chalk.gray(padEnd(prop, padding - 2)), chalk.gray.bold(parsed[prop]))
      }
    }
    console.error()
  }
}

export default describeCloudFormationFailure
