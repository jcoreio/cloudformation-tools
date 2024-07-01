import {
  DeleteInstanceProfileCommand,
  GetInstanceProfileCommand,
  IAMClient,
  RemoveRoleFromInstanceProfileCommand,
} from '@aws-sdk/client-iam'

export async function deleteIAMInstanceProfile({
  awsConfig = {},
  iam = new IAMClient(awsConfig),
  InstanceProfileName,
}: {
  awsConfig?: object
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
