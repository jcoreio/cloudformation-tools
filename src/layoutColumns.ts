export function wrapIndex(s: string, maxWidth: number): number {
  if (s.length <= maxWidth) return s.length
  for (let i = maxWidth; i >= Math.min(3, maxWidth); i--) {
    if (/\s/.test(s[i - 1])) return i
  }
  for (let i = maxWidth; i >= Math.min(3, maxWidth); i--) {
    if (
      /[a-z0-9]/i.test(s[i]) &&
      (/[^a-z0-9]/i.test(s[i - 1]) ||
        /[a-z0-9][A-Z]|[0-9][a-zA-Z]/.test(s.substring(i - 1, i + 1)))
    ) {
      return i
    }
  }
  return maxWidth
}
export default function layoutColumns({
  columns,
  widths,
  delimiter,
}: {
  columns: any[]
  widths: number[]
  delimiter?: string
}): string {
  const lines: Array<string> = []
  const strColumns = columns.map((c) => (c == null ? '' : String(c)))
  do {
    const line = strColumns.map((text: string, index: number): string => {
      if (text.length > widths[index]) {
        const splitIndex = wrapIndex(text, widths[index])
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
