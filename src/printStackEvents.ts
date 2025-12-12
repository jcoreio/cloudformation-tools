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
  const numColumns = 6
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
    'MM/dd/yyyy HH:mm:ss AM'.length < width / 5 ?
      'MM/dd/yyyy HH:mm:ss AM'.length
    : 'HH:mm:ss AM'.length
  remWidth -= timestampWidth
  const deltaWidth = 6
  remWidth -= deltaWidth
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
    deltaWidth,
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
          '+Delta',
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
  const startTimestamps = new Map<string, Date | undefined>()
  for await (const event of events) {
    if (
      event.LogicalResourceId &&
      !startTimestamps.has(event.LogicalResourceId)
    ) {
      startTimestamps.set(event.LogicalResourceId, event.Timestamp)
    }
    const startTimestamp =
      event.LogicalResourceId ?
        startTimestamps.get(event.LogicalResourceId)
      : undefined
    const delta =
      event.Timestamp && startTimestamp != null ?
        event.Timestamp.getTime() - startTimestamp.getTime()
      : undefined
    out.write(
      statusColor(event.ResourceStatus)(
        layoutColumns({
          columns: [
            event.Timestamp?.toLocaleString(),
            formatDelta(delta),
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

function formatDelta(delta: number | undefined) {
  if (!delta) return ''
  const ms = delta % 1000
  delta = (delta - ms) / 1000
  const s = delta % 60
  delta = (delta - s) / 60
  const m = delta % 60
  delta = (delta - m) / 60
  const h = delta
  return (
    '+' +
    [
      ...(h ? [h] : []),
      m.toFixed().padStart(2, '0'),
      s.toFixed().padStart(2, '0'),
    ].join(':')
  )
}
