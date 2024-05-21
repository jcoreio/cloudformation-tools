#!/usr/bin/env node

import AWS from 'aws-sdk'
import type { Writable } from 'stream'
import { table, getBorderCharacters } from 'table'
import chalk from 'chalk'

function formatStatus(
  status: AWS.CloudFormation.StackResource['ResourceStatus']
): string {
  if ('DELETE_COMPLETE' === status) return chalk.gray(status)
  if (/_COMPLETE$/.test(status)) return chalk.green(status)
  if (/_FAILED$/.test(status)) return chalk.red(status)
  if (/_IN_PROGRESS$/.test(status)) return chalk.hex('#0073bb')(status)
  return status
}

export default function printStackResources({
  resources,
  stream,
}: {
  stream?: Writable | undefined
  resources:
    | AWS.CloudFormation.StackResources
    | AWS.CloudFormation.StackResourceSummaries
}) {
  if (!resources.length) return
  if (!stream) stream = process.stderr
  const data = resources.map(
    ({
      LogicalResourceId,
      // PhysicalResourceId,
      ResourceType,
      ResourceStatus,
      ResourceStatusReason,
    }) => [
      LogicalResourceId,
      // PhysicalResourceId,
      ResourceType,
      formatStatus(ResourceStatus),
      ResourceStatusReason,
    ]
  )
  stream.write(
    table(data, {
      border: getBorderCharacters(`void`),
      columnDefault: {
        paddingLeft: 0,
        paddingRight: 1,
      },
      drawHorizontalLine: () => false,
    }) + '\n'
  )
}
