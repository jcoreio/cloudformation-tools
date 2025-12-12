import { describe, it, beforeEach, afterEach } from 'mocha'
import { UpsertIAMRoleProperties } from '../src/upsertIAMRole'
import {
  GetInstanceProfileCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam'
import { deleteIAMRole } from '../src/deleteIAMRole'
import { expect } from 'chai'
import {
  UpsertIAMInstanceProfileProperties,
  upsertIAMInstanceProfile,
} from '../src/upsertIAMInstanceProfile'
import { deleteIAMInstanceProfile } from '../src/deleteIAMInstanceProfile'

describe.skip(`upsertIAMInstanceProfile`, function () {
  this.timeout(30000)
  const iam = new IAMClient()

  const roleProperties: UpsertIAMRoleProperties = {
    Path: '/',
    RoleName: 'upsertIAMRoleTest',
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        },
      ],
    },
    ManagedPolicyArns: [
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    ],
    Policies: [
      {
        PolicyName: 'SignalResource',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'cloudformation:SignalResource',
              Resource:
                'arn:aws:cloudformation:us-west-2:052972125574:stack/Foo-*',
            },
          ],
        },
      },
      {
        PolicyName: 'CloudWatchAgentPutLogsRetention',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'logs:PutRetentionPolicy',
              Resource: '*',
            },
          ],
        },
      },
    ],
  }

  const properties: UpsertIAMInstanceProfileProperties = {
    InstanceProfileName: 'upsertIAMInstanceProfileTest',
    Roles: [roleProperties],
  }
  const { InstanceProfileName } = properties

  const { RoleName } = roleProperties

  async function cleanup() {
    await Promise.all([
      deleteIAMInstanceProfile({ iam, InstanceProfileName }).catch(
        (error: unknown) => {
          if (
            !(error instanceof Error && error.name === 'NoSuchEntityException')
          ) {
            throw error
          }
        }
      ),
      deleteIAMRole({ iam, RoleName }).catch((error: unknown) => {
        if (
          !(error instanceof Error && error.name === 'NoSuchEntityException')
        ) {
          throw error
        }
      }),
    ])
  }

  beforeEach(cleanup)
  afterEach(cleanup)

  it(`works`, async function () {
    await upsertIAMInstanceProfile({ ...properties, iam })
    await upsertIAMInstanceProfile({ ...properties, Roles: [RoleName], iam })

    {
      const [
        { InstanceProfile },
        { AttachedPolicies = [] },
        { PolicyNames = [] },
      ] = await Promise.all([
        iam.send(new GetInstanceProfileCommand({ InstanceProfileName })),
        iam.send(new ListAttachedRolePoliciesCommand({ RoleName })),
        iam.send(new ListRolePoliciesCommand({ RoleName })),
      ])
      expect(
        InstanceProfile?.Roles?.map((r) => r.RoleName).sort()
      ).to.deep.equal(
        properties.Roles?.map((r) =>
          typeof r === 'string' ? r : r.RoleName
        ).sort()
      )
      expect(AttachedPolicies.map((p) => p.PolicyArn).sort()).to.deep.equal(
        [...(roleProperties.ManagedPolicyArns || [])].sort()
      )
      expect(PolicyNames.sort()).to.deep.equal(
        (roleProperties.Policies?.map((p) => p.PolicyName) || []).sort()
      )
    }

    await upsertIAMInstanceProfile({ ...properties, Roles: [], iam })

    {
      const [{ InstanceProfile }] = await Promise.all([
        iam.send(new GetInstanceProfileCommand({ InstanceProfileName })),
      ])
      expect(
        InstanceProfile?.Roles?.map((r) => r.RoleName).sort()
      ).to.deep.equal([])
    }
  })
})
