/**
 * @prettier
 * @flow
 */

import { type StackEvent } from './getCurrentStackEvents'
import { type Writable } from 'stream'
import printColumns from './printColumns'
import chalk from 'chalk'

function statusColor(status: string): (text: string) => string {
  if ('DELETE_COMPLETE' === status) return chalk.gray
  if (/_COMPLETE$/.test(status)) return chalk.green
  if (/_FAILED$/.test(status)) return chalk.red
  if (/_IN_PROGRESS$/.test(status)) return chalk.hex('#0073bb')
  return (text) => text
}

export default async function printStackEvents({
  events,
  out = process.stderr,
  printHeader,
}: {|
  events: AsyncIterable<StackEvent>,
  out?: Writable,
  printHeader?: boolean,
|}) {
  const numColumns = 5
  const trueWidth = (out: any).columns ?? 80
  let width = trueWidth - numColumns + 1

  const minColWidth = width / numColumns

  const timestampWidth = Math.min(24, minColWidth)
  width -= timestampWidth
  const stackNameWidth = Math.min(32, minColWidth)
  width -= stackNameWidth
  const resourceIdWidth = Math.min(32, minColWidth)
  width -= resourceIdWidth
  const statusWidth = Math.min(
    'UPDATE_FAILED_ROLLBACK_IN_PROGRESS'.length,
    minColWidth
  )
  width -= statusWidth
  const reasonWidth = width

  const widths = [
    timestampWidth,
    stackNameWidth,
    resourceIdWidth,
    statusWidth,
    reasonWidth,
  ]
  if (printHeader) {
    out.write(
      printColumns({
        columns: [
          'Timestamp',
          'Stack Name',
          'Logical Resource Id',
          'Resource Status',
          'Resource Status Reason',
        ],
        widths,
        delimiter: ' ',
      })
    )
    out.write('='.repeat(trueWidth) + '\n')
  }
  for await (const event of events) {
    out.write(
      statusColor(event.ResourceStatus)(
        printColumns({
          columns: [
            event.Timestamp.toLocaleString(),
            event.StackName,
            event.LogicalResourceId,
            event.ResourceStatus,
            event.ResourceStatusReason,
          ],
          widths,
          delimiter: ' ',
        })
      )
    )
  }
}
