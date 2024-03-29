#!/usr/bin/env node
/**
 * @flow
 * @prettier
 */

import AWS from 'aws-sdk'
import { fromPairs } from 'lodash'

export default async function getStackOutputs({
  cloudformation,
  awsConfig,
  StackName,
  region,
}: {
  cloudformation?: ?AWS.CloudFormation,
  awsConfig?: ?{ ... },
  StackName: string,
  region?: ?string,
}): Promise<{ [resource: string]: string }> {
  if (!StackName) throw new Error('missing StackName')
  if (!awsConfig) awsConfig = { ...(region ? { region } : {}) }
  if (!cloudformation) cloudformation = new AWS.CloudFormation(awsConfig)
  const {
    Stacks: [{ Outputs }],
  } = await cloudformation
    .describeStacks({
      StackName,
    })
    .promise()
  return fromPairs(Outputs.map((o) => [o.OutputKey, o.OutputValue]))
}

if (!module.parent) {
  getStackOutputs({ StackName: process.argv[2] }).then(
    (outputs) => console.log(outputs), // eslint-disable-line no-console
    (err: Error) => {
      console.error(err.stack) // eslint-disable-line no-console
      process.exit(1)
    }
  )
}
