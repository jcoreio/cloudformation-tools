// @flow

import chalk from 'chalk'
import {spawn} from 'promisify-child-process'
import poll from '@jcoreio/poll'

import describeCloudFormationFailure from './describeCloudFormationFailure'
import getStackResources from './getStackResources'
import printStackResources from './printStackResources'

async function deployCloudFormationStack({
  stackName,
  templateFile,
  parameterOverrides,
  additionalArgs,
}: {
  stackName: string,
  templateFile: string,
  parameterOverrides?: ?Object,
  additionalArgs?: ?Array<string>,
}): Promise<void> {
  const args = [
    'cloudformation', 'deploy', '--stack-name', stackName,
    '--template-file', templateFile,
    ...(additionalArgs || []),
  ]
  if (parameterOverrides) {
    args.push('--parameter-overrides')
    for (let param in parameterOverrides) {
      args.push(`${param}=${parameterOverrides[param]}`)
    }
  }
  let succeeded = false, failed = false
  const start = new Date()
  console.log(chalk.gray(`$ aws ${args.join(' ')}`)) // eslint-disable-line no-console
  const doDeploy = () => spawn('aws', args, {stdio: 'inherit'})
    .catch((err: any) => {
      console.error('deploy failed')
    })
  if (process.env.CI) {
    await doDeploy()
  } else {
    doDeploy()

    await poll(async () => {
      const response = JSON.parse(
        // $FlowFixMe: ok to await spawn
        (await spawn('aws', [
          'cloudformation', 'list-change-sets', '--stack-name', stackName,
        ])).stdout.toString('utf8')
      )
      const hasChanges = response.Summaries.findIndex(s => new Date(s.CreationTime) > start) >= 0
      if (!hasChanges)
        throw Error('no changes yet')
    }, 3000).timeout(30000)

    while (!succeeded && !failed) {
      const statusPromise = spawn('aws', [
        'cloudformation', 'describe-stacks', '--stack-name', stackName,
        '--query', 'Stacks[0].StackStatus', '--output', 'text',
      ])
      const resources = await getStackResources(stackName, {echo: false})
      //console.log(ansi.eraseScreen)
      if (resources.length) printStackResources(resources)
      else console.log('waiting for stack resources to be created...')
      console.log(new Date().toString())
      // $FlowFixMe: ok to await spawn promise
      const status = (await statusPromise).stdout.toString('utf8').trim()
      if (/FAILED$/.test(status)) {
        failed = true
        await describeCloudFormationFailure(stackName)
      } else if (/COMPLETE$/.test(status)) {
        succeeded = true
      }
    }
  }
  console.log((failed ? chalk.red : chalk.green)(`deploy ${failed ? 'failed' : 'succeeded'}`))
}

export default deployCloudFormationStack
