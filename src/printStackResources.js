// @flow

import {table, getBorderCharacters} from 'table'
import chalk from 'chalk'

function formatStatus(status: string): string {
  if ('DELETE_COMPLETE' === status) return chalk.gray(status)
  if (/_COMPLETE$/.test(status)) return chalk.green(status)
  if (/_FAILED$/.test(status)) return chalk.red(status)
  if (/_IN_PROGRESS$/.test(status)) return chalk.hex('#f90')(status)
  return status
}

export default function printStackResources(resources: Array<Object>) {
  const data = resources.map(({
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
  ])

  console.error(table(data, {
    border: getBorderCharacters(`void`),
    columnDefault: {
      paddingLeft: 0,
      paddingRight: 1
    },
    drawHorizontalLine: () => false,
  }))
}
