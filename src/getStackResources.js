// @flow

import {spawn} from 'promisify-child-process'
import chalk from 'chalk'

const maxItems = 100

async function getStackResources(stackName: string, {echo}: {echo?: ?boolean} = {}): Promise<Array<Object>> {
  async function getResources(startingToken: ?string = null): Promise<Object> {
    const args = [
      'cloudformation', 'list-stack-resources', '--stack-name', stackName,
      '--max-items', maxItems,
    ]
    if (startingToken) args.push('--starting-token', startingToken)
    if (false !== echo) {
      console.error(chalk.gray(`$ aws ${args.join(' ')}`)) // eslint-disable-line no-console
    }
    // $FlowFixMe: ok to await spawn
    return JSON.parse((await spawn('aws', args)).stdout.toString('utf8'))
  }

  const resources = []
  let result = await getResources()
  do {
    resources.push(...result.StackResourceSummaries)
    if (result.NextToken) result = await getResources(result.NextToken)
  } while (result.NextToken)
  return resources
}

export default getStackResources
