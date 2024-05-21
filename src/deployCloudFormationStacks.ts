import {
  CloudFormationClient,
  CloudFormationClientConfig,
} from '@aws-sdk/client-cloudformation'
import deployCloudFormationStack, {
  DeployCloudFormationStackInput,
  DeployCloudFormationStackOutput,
} from './deployCloudFormationStack'

export default function deployCloudFormationStacks({
  awsConfig,
  cloudformation,
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
    Omit<DeployCloudFormationStackInput, 'cloudformation' | 'approve' | 's3'>
  >
}): Promise<Array<DeployCloudFormationStackOutput>> {
  return Promise.all(
    stacks.map((stack) =>
      deployCloudFormationStack({
        awsConfig,
        ...stack,
        cloudformation,
        s3,
        approve: false,
      })
    )
  )
}
