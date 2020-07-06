/**
 * @prettier
 * @flow
 */

import deployCloudFormationStack from './deployCloudFormationStack'
import watchStackResources from './watchStackResources'
import AWS from 'aws-sdk'
import { type Readable } from 'stream'

type Parameter = {
  ParameterKey: string,
  ParameterValue: string,
  UsePreviousValue?: ?boolean,
}

type Tag = {
  Key: string,
  Value: string,
}

export default function deployCloudFormationStacks({
  cloudformation,
  s3,
  stacks,
  watchResources,
}: {
  cloudformation?: ?AWS.CloudFormation,
  s3?: {
    Bucket: string,
    prefix?: ?string,
    SSEKMSKeyId?: ?string,
    forceUpload?: ?boolean,
  },
  stacks: $ReadOnlyArray<{
    region?: ?string,
    StackName: string,
    Template?: ?Object,
    TemplateFile?: ?string,
    TemplateBody?: ?(Buffer | string | (() => Readable)),
    Parameters?: ?({ [string]: any } | Array<Parameter>),
    Capabilities?: ?Array<string>,
    RoleARN?: ?string,
    NotificationARNs?: ?Array<string>,
    Tags?: ?({ [string]: any } | Array<Tag>),
    readOutputs?: ?boolean,
  }>,
  watchResources?: ?boolean,
}): Promise<
  Array<{
    ChangeSetName: string,
    ChangeSetType: string,
    HasChanges: boolean,
    UserAborted: boolean,
    Outputs: { [resourceName: string]: string },
  }>
> {
  const watchablePromises: Array<Promise<void>> = []

  const addWatchablePromise = (): (() => void) => {
    let signalWatchable
    new Promise(resolve => (signalWatchable = resolve))
    if (!signalWatchable) {
      throw new Error('unexpected: signalWatchable is not initialized')
    }
    return signalWatchable
  }

  const result = Promise.all(
    stacks.map(stack =>
      deployCloudFormationStack({
        ...stack,
        cloudformation,
        s3,
        signalWatchable: watchStackResources
          ? addWatchablePromise()
          : undefined,
        watchResources: false,
        approve: false,
      })
    )
  )

  if (watchStackResources) {
    Promise.all(watchablePromises).then(() => {
      watchStackResources({
        cloudformation,
        StackNames: stacks.map(stack => stack.StackName),
        whilePending: result,
      })
    })
  }

  return result
}
