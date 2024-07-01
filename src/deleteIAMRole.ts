import {
  DeleteRoleCommand,
  DeleteRolePolicyCommand,
  DetachRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam'

export async function deleteIAMRole({
  awsConfig = {},
  iam = new IAMClient(awsConfig),
  RoleName,
}: {
  awsConfig?: object
  iam?: IAMClient
  RoleName: string
}) {
  const [{ AttachedPolicies = [] }, { PolicyNames = [] }] = await Promise.all([
    iam.send(new ListAttachedRolePoliciesCommand({ RoleName })),
    iam.send(new ListRolePoliciesCommand({ RoleName })),
  ])

  await Promise.all([
    ...AttachedPolicies.map(async ({ PolicyArn }) => {
      await iam.send(new DetachRolePolicyCommand({ RoleName, PolicyArn }))
    }),
    ...PolicyNames.map(async (PolicyName) => {
      await iam.send(new DeleteRolePolicyCommand({ RoleName, PolicyName }))
    }),
  ])

  await iam.send(new DeleteRoleCommand({ RoleName }))
}
