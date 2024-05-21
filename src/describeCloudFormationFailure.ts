#!/usr/bin/env node

import type { Writable } from 'stream'
import chalk from 'chalk'
import getCurrentStackEvents from './getCurrentStackEvents'
import {
  CloudFormationClient,
  CloudFormationClientConfig,
} from '@aws-sdk/client-cloudformation'

function wrapString(str: string, width: number): Array<string> {
  if (!str) return []
  const result: Array<string> = []
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
  stream?: Writable | undefined
  awsConfig?: CloudFormationClientConfig
  cloudformation?: CloudFormationClient
  StackName: string
}) {
  const { awsConfig, cloudformation, StackName } = options
  const stream: Writable = options.stream || process.stderr
  const padding = 25
  for await (const event of getCurrentStackEvents({
    awsConfig,
    cloudformation,
    StackName,
  })) {
    if (
      !/(CREATE|UPDATE)_FAILED|ROLLBACK_IN_PROGRESS/.test(
        event.ResourceStatus || ''
      )
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
      chalk`${'ResourceStatus'.padEnd(padding)} {red ${event.ResourceStatus}}\n`
    )
    stream.write(`${'ResourceType'.padEnd(padding)} ${event.ResourceType}\n`)
    for (const field of ['LogicalResourceId', 'PhysicalResourceId'] as const) {
      stream.write(chalk`${field.padEnd(padding)} {bold ${event[field]}}\n`)
    }
    const { ResourceStatusReason, ResourceProperties } = event
    if (ResourceStatusReason) {
      stream.write('ResourceStatusReason\n')
      const width = Number.isFinite((stream as any).columns)
        ? Math.min(80, Math.max(40, (stream as any).columns - 2))
        : 80
      for (const line of wrapString(ResourceStatusReason, width)) {
        stream.write(chalk`  {bold ${line}}\n`)
      }
    }
    if (ResourceProperties) {
      const parsed = JSON.parse(ResourceProperties)
      stream.write('ResourceProperties\n')
      for (const prop in parsed) {
        stream.write(
          chalk`  {gray ${prop.padEnd(padding - 2)}} {bold ${parsed[prop]}}\n`
        )
      }
    }
    stream.write('\n')
  }
}
if (!module.parent) {
  describeCloudFormationFailure({
    StackName: process.argv[2],
  }).then(
    () => process.exit(0),
    (err: Error) => {
      console.error(err.stack) // eslint-disable-line no-console
      process.exit(1)
    }
  )
}
