// @flow

import {spawn} from 'promisify-child-process'
import chalk from 'chalk'

const maxItems = 100

async function getEvents(stackName: string, startingToken: ?string = null): Promise<Object> {
  const args = [
    'cloudformation', 'describe-stack-events', '--stack-name', stackName,
    '--max-items', maxItems,
  ]
  if (startingToken) args.push('--starting-token', startingToken)
  console.error(chalk.gray(`$ aws ${args.join(' ')}`)) // eslint-disable-line no-console
  // $FlowFixMe: ok to await spawn
  return JSON.parse((await spawn('aws', args)).stdout.toString('utf8'))
}

async function getCurrentStackEvents(stackName: string): Promise<Array<any>> {
  const events = []
  let result = await getEvents(stackName)
  let foundNonStackEvent = false
  do {
    for (let event of result.StackEvents) {
      if ('AWS::CloudFormation::Stack' === event.ResourceType) {
        if (foundNonStackEvent) return events
      } else {
        foundNonStackEvent = true
      }
      events.push(event)
    }
    if (result.NextToken) result = await getEvents(stackName, result.NextToken)
  } while (result.NextToken)
  return events
}

export default getCurrentStackEvents
