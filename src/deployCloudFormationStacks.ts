import {
  CloudFormationClient,
  CloudFormationClientConfig,
} from '@aws-sdk/client-cloudformation'
import deployCloudFormationStack, {
  ApproveFn,
  DeployCloudFormationStackInput,
  DeployCloudFormationStackOutput,
} from './deployCloudFormationStack'

export default function deployCloudFormationStacks({
  awsConfig,
  cloudformation,
  approve,
  s3,
  stacks,
}: {
  cloudformation?: CloudFormationClient
  awsConfig?: CloudFormationClientConfig
  s3?: {
    Bucket: string
    prefix?: string
    SSEKMSKeyId?: string
    forceUpload?: boolean
  }
  stacks: ReadonlyArray<
    Omit<DeployCloudFormationStackInput, 'cloudformation' | 's3'>
  >
  approve: boolean | ApproveFn
}): Promise<Array<DeployCloudFormationStackOutput>> {
  return Promise.all(
    stacks.map((stack) =>
      deployCloudFormationStack({
        awsConfig,
        approve,
        ...stack,
        cloudformation,
        s3,
      })
    )
  )
}
