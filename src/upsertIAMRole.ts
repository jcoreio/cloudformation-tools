import {
  IAMClient,
  CreateRoleRequest,
  IAMClientConfig,
  CreateRoleCommand,
  PutRolePolicyCommand,
  AttachRolePolicyCommand,
  CreateRoleCommandOutput,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  DetachRolePolicyCommand,
  DeleteRolePolicyCommand,
} from '@aws-sdk/client-iam'

export type UpsertIAMRoleProperties = Omit<
  CreateRoleRequest,
  'RoleName' | 'AssumeRolePolicyDocument'
> & {
  RoleName: string
  AssumeRolePolicyDocument: string | object
  Policies?: { PolicyName: string; PolicyDocument: string | object }[]
  ManagedPolicyArns?: string[]
}

/**
 * Upserts an IAM Role.  Doing so with CloudFormation isn't very slow (~15 seconds),
 * but creating and InstanceProfile with CloudFormation is slow af (~2 minutes), so
 * this exists to support upsertIAMInstanceProfile.
 */
export async function upsertIAMRole({
  awsConfig = {},
  iam = new IAMClient(awsConfig),
  Policies,
  ManagedPolicyArns,
  AssumeRolePolicyDocument,
  ...rest
}: UpsertIAMRoleProperties & {
  iam?: IAMClient
  awsConfig?: IAMClientConfig
}): Promise<CreateRoleCommandOutput> {
  const { RoleName } = rest
  const result = await iam
    .send(
      new CreateRoleCommand({
        ...rest,
        AssumeRolePolicyDocument: stringify(AssumeRolePolicyDocument),
      })
    )
    .catch(async (error) => {
      if (
        !(
          error instanceof Error &&
          error.name === 'EntityAlreadyExistsException'
        )
      ) {
        throw error
      }
      return await iam.send(new GetRoleCommand({ RoleName }))
    })
  const [{ AttachedPolicies = [] }, { PolicyNames = [] }] = await Promise.all([
    iam.send(new ListAttachedRolePoliciesCommand({ RoleName })),
    iam.send(new ListRolePoliciesCommand({ RoleName })),
  ])

  await Promise.all([
    ...AttachedPolicies.map(async ({ PolicyArn }) => {
      if (PolicyArn && !ManagedPolicyArns?.includes(PolicyArn)) {
        await iam.send(new DetachRolePolicyCommand({ RoleName, PolicyArn }))
      }
    }),
    ...PolicyNames.map(async (PolicyName) => {
      if (!Policies?.some((p) => p.PolicyName === PolicyName)) {
        await iam.send(new DeleteRolePolicyCommand({ RoleName, PolicyName }))
      }
    }),
    ...(Policies?.map(async ({ PolicyName, PolicyDocument }) => {
      await iam.send(
        new PutRolePolicyCommand({
          RoleName,
          PolicyName,
          PolicyDocument: stringify(PolicyDocument),
        })
      )
    }) || []),
    ...(ManagedPolicyArns?.map(async (PolicyArn) => {
      await iam.send(
        new AttachRolePolicyCommand({
          RoleName,
          PolicyArn,
        })
      )
    }) || []),
  ])
  return result
}

function stringify(document: string | object) {
  return typeof document === 'string' ? document : JSON.stringify(document)
}
