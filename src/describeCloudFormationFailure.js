#!/usr/bin/env node
/**
 * @flow
 * @prettier
 */

import type AWS from 'aws-sdk'
import type { Writable } from 'stream'
import chalk from 'chalk'
import { padEnd } from 'lodash'
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

export default async function describeCloudFormationFailure(options: {
  stream?: ?Writable,
  cloudformation?: ?AWS.CloudFormation,
  StackName: string,
}) {
  const { cloudformation, StackName } = options
  const stream = options.stream || process.stderr
  const padding = 25

  for await (let event of getCurrentStackEvents({
    cloudformation,
    StackName,
  })) {
    if (
      !/(CREATE|UPDATE)_FAILED|ROLLBACK_IN_PROGRESS/.test(event.ResourceStatus)
    ) {
      continue
    }
    if (
      event.ResourceStatusReason &&
      /resource creation cancell?ed|the following resource\(?s?\)? failed/i.test(
        event.ResourceStatusReason
      )
    ) {
      continue
    }
    stream.write(
      chalk`${padEnd('ResourceStatus', padding)} {red ${
        event.ResourceStatus
      }}\n`
    )
    stream.write(`${padEnd('ResourceType', padding)} ${event.ResourceType}\n`)
    for (let field of ['LogicalResourceId', 'PhysicalResourceId']) {
      stream.write(chalk`${padEnd(field, padding)} {bold ${event[field]}}\n`)
    }
    const { ResourceStatusReason, ResourceProperties } = event
    if (ResourceStatusReason) {
      stream.write('ResourceStatusReason\n')
      const width = Number.isFinite((stream: any).columns)
        ? Math.min(80, Math.max(40, (stream: any).columns - 2))
        : 80
      for (let line of wrapString(ResourceStatusReason, width)) {
        stream.write(chalk`  {bold ${line}}\n`)
      }
    }
    if (ResourceProperties) {
      const parsed = JSON.parse(ResourceProperties)
      stream.write('ResourceProperties\n')
      for (let prop in parsed) {
        stream.write(
          chalk`  {gray ${padEnd(prop, padding - 2)}} {bold ${parsed[prop]}}\n`
        )
      }
    }
    stream.write('\n')
  }
}

if (!module.parent) {
  describeCloudFormationFailure({ StackName: process.argv[2] }).then(
    () => process.exit(0),
    (err: Error) => {
      console.error(err.stack) // eslint-disable-line no-console
      process.exit(1)
    }
  )
}
