#!/usr/bin/env node
/**
 * @flow
 * @prettier
 */
import AWS from 'aws-sdk'
export default async function getStackOutputs({
  cloudformation,
  awsConfig,
  StackName,
  region,
}: {
  cloudformation?: AWS.CloudFormation | null | undefined
  awsConfig?: Record<any, any> | null | undefined
  StackName: string
  region?: string | null | undefined
}): Promise<{
  [resource: string]: string
}> {
  if (!StackName) throw new Error('missing StackName')
  if (!awsConfig)
    awsConfig = {
      ...(region
        ? {
            region,
          }
        : {}),
    }
  if (!cloudformation) cloudformation = new AWS.CloudFormation(awsConfig)
  const { Stacks: [{ Outputs = [] } = {}] = [] } = await cloudformation
    .describeStacks({
      StackName,
    })
    .promise()
  return Object.fromEntries(
    Outputs.flatMap((o) =>
      o.OutputKey != null && o.OutputValue != null
        ? [[o.OutputKey, o.OutputValue]]
        : []
    )
  )
}
if (!module.parent) {
  getStackOutputs({
    StackName: process.argv[2],
  }).then(
    // eslint-disable-next-line no-console
    (outputs) => console.log(outputs),
    (err: Error) => {
      // eslint-disable-next-line no-console
      console.error(err.stack)
      process.exit(1)
    }
  )
}
