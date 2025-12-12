#!/usr/bin/env node

import {
  CloudFormationClient,
  CloudFormationClientConfig,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation'

/**
 * @flow
 * @prettier
 */
export default async function getStackOutputs({
  cloudformation,
  awsConfig,
  StackName,
  region,
}: {
  cloudformation?: CloudFormationClient
  awsConfig?: CloudFormationClientConfig
  StackName: string
  region?: string
}): Promise<{
  [resource: string]: string
}> {
  if (!StackName) throw new Error('missing StackName')
  if (!awsConfig)
    awsConfig = {
      ...(region ?
        {
          region,
        }
      : {}),
    }
  if (!cloudformation) cloudformation = new CloudFormationClient(awsConfig)
  const { Stacks: [{ Outputs = [] } = {}] = [] } = await cloudformation.send(
    new DescribeStacksCommand({
      StackName,
    })
  )
  return Object.fromEntries(
    Outputs.flatMap((o) =>
      o.OutputKey != null && o.OutputValue != null ?
        [[o.OutputKey, o.OutputValue]]
      : []
    )
  )
}
