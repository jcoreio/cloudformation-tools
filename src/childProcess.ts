import chalk from 'chalk'
import {
  ChildProcessPromise,
  PromisifySpawnOptions,
  spawn as _spawn,
} from 'promisify-child-process'

/* eslint-disable no-console */

function stringifyArg(arg: string) {
  return /[^-_a-z0-9:/.]/i.test(arg) ? JSON.stringify(arg) : arg
}

function displayCommand(command: string, args: string[]) {
  return chalk.grey(
    `$ ${command}${args.length ? ' ' : ''}${args.map(stringifyArg).join(' ')}`
  )
}

export function spawn(
  command: string,
  options?: PromisifySpawnOptions
): ChildProcessPromise
export function spawn(
  command: string,
  args: string[],
  options?: PromisifySpawnOptions
): ChildProcessPromise
export function spawn(
  command: string,
  args?: string[] | PromisifySpawnOptions,
  options?: PromisifySpawnOptions
): ChildProcessPromise {
  console.error(displayCommand(command, Array.isArray(args) ? args : []))
  const child = (_spawn as any)(command, args, options)
  if (child.stderr)
    child.stderr.on('data', (data: string | Buffer) =>
      process.stderr.write(data)
    )
  return child
}
