import {
  CreateInstanceProfileRequest,
  AddRoleToInstanceProfileCommand,
  IAMClient,
  IAMClientConfig,
  CreateInstanceProfileCommand,
  GetInstanceProfileCommand,
  GetInstanceProfileCommandOutput,
  RemoveRoleFromInstanceProfileCommand,
} from '@aws-sdk/client-iam'
import { UpsertIAMRoleProperties, upsertIAMRole } from './upsertIAMRole'

export type UpsertIAMInstanceProfileProperties = Omit<
  CreateInstanceProfileRequest,
  'InstanceProfileName'
> & {
  InstanceProfileName: string
  Roles?: (string | UpsertIAMRoleProperties)[]
}

/**
 * Upserts an IAM InstanceProfile.  Doing so with CloudFormation is slow af (~2 minutes)
 * even though it only takes a few seconds via the SDK.
 */
export async function upsertIAMInstanceProfile({
  awsConfig = {},
  iam = new IAMClient(awsConfig),
  Roles,
  ...rest
}: UpsertIAMInstanceProfileProperties & {
  iam?: IAMClient
  awsConfig?: IAMClientConfig
}): Promise<GetInstanceProfileCommandOutput> {
  const { InstanceProfileName } = rest
  const result = await iam
    .send(new CreateInstanceProfileCommand({ ...rest }))
    .catch(async (error: unknown) => {
      if (
        !(
          error instanceof Error &&
          error.name === 'EntityAlreadyExistsException'
        )
      ) {
        throw error
      }
      return await iam.send(
        new GetInstanceProfileCommand({ InstanceProfileName })
      )
    })

  await Promise.all([
    ...(result.InstanceProfile?.Roles?.map(async ({ RoleName }) => {
      if (
        RoleName &&
        !Roles?.some(
          (r) => (typeof r === 'string' ? r : r.RoleName) === RoleName
        )
      ) {
        await iam.send(
          new RemoveRoleFromInstanceProfileCommand({
            InstanceProfileName,
            RoleName,
          })
        )
      }
    }) || []),
    ...(Roles?.map(async (role) => {
      if (typeof role !== 'string') {
        await upsertIAMRole({ iam, ...role })
      }
      const RoleName = typeof role === 'string' ? role : role.RoleName
      await iam
        .send(
          new AddRoleToInstanceProfileCommand({
            InstanceProfileName,
            RoleName,
          })
        )
        .catch((error: unknown) => {
          if (
            !(error instanceof Error && error.name === 'LimitExceededException')
          ) {
            throw error
          }
        })
    }) || []),
  ])

  return await iam.send(new GetInstanceProfileCommand({ InstanceProfileName }))
}
