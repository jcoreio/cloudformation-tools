import {
  DeleteInstanceProfileCommand,
  GetInstanceProfileCommand,
  IAMClient,
  IAMClientConfig,
  RemoveRoleFromInstanceProfileCommand,
} from '@aws-sdk/client-iam'

export async function deleteIAMInstanceProfile({
  awsConfig = {},
  iam = new IAMClient(awsConfig),
  InstanceProfileName,
}: {
  awsConfig?: IAMClientConfig
  iam?: IAMClient
  InstanceProfileName: string
}) {
  const { InstanceProfile } = await iam.send(
    new GetInstanceProfileCommand({ InstanceProfileName })
  )
  await Promise.all(
    InstanceProfile?.Roles?.map(({ RoleName }) =>
      iam.send(
        new RemoveRoleFromInstanceProfileCommand({
          InstanceProfileName,
          RoleName,
        })
      )
    ) || []
  )
  await iam.send(new DeleteInstanceProfileCommand({ InstanceProfileName }))
}
