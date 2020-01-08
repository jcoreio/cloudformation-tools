const chalk = require('chalk')
const { spawn: _spawn } = require('promisify-child-process')

/* eslint-disable no-console */

function stringifyArg(arg) {
  return /[^-_a-z0-9:/.]/i.test(arg) ? JSON.stringify(arg) : arg
}

function displayCommand(command, args) {
  return chalk.grey(
    `$ ${command}${args.length ? ' ' : ''}${args.map(stringifyArg).join(' ')}`
  )
}

function spawn(command, args, options) {
  console.error(displayCommand(command, Array.isArray(args) ? args : []))
  const child = _spawn(command, args, options)
  if (child.stderr) child.stderr.on('data', data => process.stderr.write(data))
  return child
}

module.exports = { spawn }
