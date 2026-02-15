import {
  Change,
  ChangeAction,
  AttributeChangeType,
  StackResourceDriftStatus,
  RequiresRecreation,
  ResourceAttribute,
  Replacement,
} from '@aws-sdk/client-cloudformation'
import { Writable } from 'stream'
import layoutColumns from './layoutColumns.js'
import chalk from 'chalk'

function actionColor(
  action?: ChangeAction,
  Replacement?: Replacement
): (text: string) => string {
  if (Replacement) {
    switch (Replacement) {
      case 'True':
        return chalk.red
      case 'Conditional':
        return chalk.yellow
      case 'False':
        break
    }
  }
  if (action) {
    switch (action) {
      case 'Add':
        return chalk.green
      case 'Remove':
        return chalk.gray
      case 'Modify':
      case 'SyncWithActual':
        return chalk.hex('#0073bb')
    }
  }
  return (text: string) => text
}

function attributeChangeTypeColor(
  changeType?: AttributeChangeType,
  RequiresRecreation?: RequiresRecreation
): (text: string) => string {
  if (RequiresRecreation) {
    switch (RequiresRecreation) {
      case 'Always':
        return chalk.red
      case 'Conditionally':
        return chalk.yellow
      case 'Never':
        break
    }
  }
  if (changeType) {
    switch (changeType) {
      case 'Add':
        return chalk.green
      case 'Remove':
        return chalk.gray
      case 'Modify':
      case 'SyncWithActual':
        return chalk.hex('#0073bb')
    }
  }
  return (text: string) => text
}

const maxLength = (map: { [K in string]?: string }) =>
  Object.values(map).reduce((max, s) => Math.max(max, s?.length ?? 0), 0)

const actionAttributeWidth = Math.max(
  maxLength(ChangeAction),
  maxLength(ResourceAttribute)
)
const resourceDriftWidth = Math.max(
  maxLength(StackResourceDriftStatus),
  'Drift Status'.length
)
const requiresRecreationWidth = maxLength(RequiresRecreation)
const attributeChangeTypeWidth = maxLength(AttributeChangeType)

export function printChanges({
  changes,
  out = process.stderr,
  printHeader,
  width = Math.max(80, (out as any).columns || 200),
}: {
  changes: Change[]
  out?: Writable
  printHeader?: boolean
  width?: number
}) {
  const changeHeader = [
    'Action',
    'Logical Resource Id',
    'Replacement',
    'Resource Type',
    'Drift Status',
  ]
  let remWidth =
    width -
    (changeHeader.length - 1) * 2 -
    actionAttributeWidth -
    requiresRecreationWidth -
    resourceDriftWidth
  const logicalResourceIdWidth = Math.min(Math.floor(remWidth / 2), 40)
  remWidth -= logicalResourceIdWidth

  const changeWidths = [
    actionAttributeWidth,
    logicalResourceIdWidth,
    requiresRecreationWidth,
    remWidth,
    resourceDriftWidth,
  ]

  const detailHeader = [
    '',
    'Attribute',
    'Property',
    'Requires Recreation',
    'Before Value',
    'After Value',
    'Change Type',
  ]
  remWidth =
    width -
    (detailHeader.length - 1) * 2 -
    actionAttributeWidth -
    requiresRecreationWidth -
    attributeChangeTypeWidth

  const propertyWidth = logicalResourceIdWidth
  remWidth -= propertyWidth
  const beforeValueWidth = Math.floor(remWidth / 2)
  remWidth -= beforeValueWidth
  const afterValueWidth = remWidth

  const detailWidths = [
    0,
    actionAttributeWidth,
    propertyWidth,
    requiresRecreationWidth,
    beforeValueWidth,
    afterValueWidth,
    attributeChangeTypeWidth,
  ]

  if (printHeader) {
    out.write(
      chalk.bold(
        layoutColumns({
          columns: changeHeader,
          widths: changeWidths,
          delimiter: '  ',
        })
      )
    )
    out.write(
      layoutColumns({
        columns: detailHeader,
        widths: detailWidths,
        delimiter: '  ',
      })
    )
    out.write('='.repeat(width) + '\n')
  }

  for (const { ResourceChange } of changes) {
    out.write(
      actionColor(
        ResourceChange?.Action,
        ResourceChange?.Replacement
      )(
        chalk.bold(
          layoutColumns({
            columns: [
              ResourceChange?.Action,
              ResourceChange?.LogicalResourceId,
              ResourceChange?.Replacement,
              ResourceChange?.ResourceType,
              ResourceChange?.ResourceDriftStatus,
            ],
            widths: changeWidths,
            delimiter: '  ',
          })
        )
      )
    )

    for (const { Target } of ResourceChange?.Details || []) {
      out.write(
        attributeChangeTypeColor(
          Target?.AttributeChangeType,
          Target?.RequiresRecreation
        )(
          layoutColumns({
            columns: [
              '',
              Target?.Attribute,
              Target?.Name,
              Target?.RequiresRecreation,
              Target?.BeforeValue,
              Target?.AfterValue,
              Target?.AttributeChangeType,
            ],
            widths: detailWidths,
            delimiter: '  ',
          })
        )
      )
    }
  }
}
