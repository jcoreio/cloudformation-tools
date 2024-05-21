import { Writable } from 'stream'
import layoutColumns from './layoutColumns'
import chalk from 'chalk'
import { StackEvent } from '@aws-sdk/client-cloudformation'
function statusColor(
  status: StackEvent['ResourceStatus']
): (text: string) => string {
  if (status) {
    if ('DELETE_COMPLETE' === status) return chalk.gray
    if (/_COMPLETE$/.test(status)) return chalk.green
    if (/_FAILED$/.test(status)) return chalk.red
    if (/_IN_PROGRESS$/.test(status)) return chalk.hex('#0073bb')
  }
  return (text: string) => text
}
export default async function printStackEvents({
  events,
  out = process.stderr,
  printHeader,
  width = Math.max(80, (out as any).columns || 200),
}: {
  events: AsyncIterable<StackEvent>
  out?: Writable
  printHeader?: boolean
  width?: number
}) {
  const numColumns = 5
  let remWidth = width - (numColumns - 1) * 2
  const statusWidth =
    [
      'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
      'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
      'UPDATE_ROLLBACK_IN_PROGRESS',
    ].find((s) => s.length < remWidth / 6)?.length ??
    'UPDATE_IN_PROGRESS'.length
  remWidth -= statusWidth
  const timestampWidth =
    'MM/dd/yyyy HH:mm:ss AM'.length < width / 5
      ? 'MM/dd/yyyy HH:mm:ss AM'.length
      : 'HH:mm:ss AM'.length
  remWidth -= timestampWidth
  let stackNameWidth, resourceIdWidth, reasonWidth
  if (remWidth / 3 < 32) {
    stackNameWidth = resourceIdWidth = Math.floor(remWidth / 3)
    remWidth -= stackNameWidth + resourceIdWidth
    reasonWidth = remWidth
  } else {
    reasonWidth = Math.floor(remWidth / 2)
    remWidth -= reasonWidth
    resourceIdWidth = Math.floor(remWidth / 2)
    remWidth -= resourceIdWidth
    stackNameWidth = remWidth
  }
  const widths = [
    timestampWidth,
    stackNameWidth,
    resourceIdWidth,
    statusWidth,
    reasonWidth,
  ]
  if (printHeader) {
    out.write(
      layoutColumns({
        columns: [
          'Timestamp',
          'Stack Name',
          'Logical Resource Id',
          'Resource Status',
          'Resource Status Reason',
        ],
        widths,
        delimiter: '  ',
      })
    )
    out.write('='.repeat(width) + '\n')
  }
  for await (const event of events) {
    out.write(
      statusColor(event.ResourceStatus)(
        layoutColumns({
          columns: [
            event.Timestamp?.toLocaleString(),
            event.StackName,
            event.LogicalResourceId,
            event.ResourceStatus,
            event.ResourceStatusReason,
          ],
          widths,
          delimiter: '  ',
        })
      )
    )
  }
}
