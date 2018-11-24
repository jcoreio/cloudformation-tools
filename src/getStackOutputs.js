// @flow

import {fromPairs} from 'lodash'
import {spawn} from 'promisify-child-process'

async function getStackOutputs(stackName: string): Promise<Object> {
  // $FlowFixMe: ok to awayt spawn
  const json = JSON.parse((await spawn('aws', [
    'cloudformation', 'describe-stacks', '--stack-name', stackName,
    '--query', 'Stacks[0].Outputs',
  ])).stdout.toString('utf8'))
  return fromPairs(json.map(o => [o.OutputKey, o.OutputValue]))
}

export default getStackOutputs
