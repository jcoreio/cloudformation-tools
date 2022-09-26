/**
 * @prettier
 * @flow
 */

export default function layoutColumns({
  columns,
  widths,
  delimiter,
}: {|
  columns: any[],
  widths: number[],
  delimiter?: string,
|}): string {
  const lines = []
  const strColumns = columns.map((c) => (c == null ? '' : String(c)))
  do {
    const line = strColumns.map((text: string, index: number): string => {
      if (text.length > widths[index]) {
        let splitIndex = Math.min(
          text.match(/\s/)?.index ??
            text.match(/[^a-z0-9]/i)?.index ??
            text.length,
          widths[index]
        )
        if (splitIndex === 0) {
          const lastIndex =
            text.match(/[a-z0-9_]/i)?.index ?? text.match(/\S/)?.index ?? 1
          const sub = text.substring(lastIndex)
          splitIndex = Math.min(
            (sub.match(/\s/)?.index ??
              sub.match(/[^a-z0-9]/i)?.index ??
              widths[index] ??
              sub.length) + lastIndex,
            widths[index]
          )
        }
        const result = text.substring(0, splitIndex).trim()
        strColumns[index] = text.substring(splitIndex).trim()
        return result.padEnd(widths[index], ' ')
      }
      strColumns[index] = ''
      return text.padEnd(widths[index], ' ')
    })
    lines.push(line.join(delimiter || ''))
  } while (strColumns.find((c) => c.length))
  return lines.join('\n') + '\n'
}
