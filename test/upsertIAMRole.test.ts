/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, beforeEach, afterEach } from 'mocha'
import { UpsertIAMRoleProperties } from '../src/upsertIAMRole'
import { upsertIAMRole } from '../src/upsertIAMRole'
import {
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam'
import { deleteIAMRole } from '../src/deleteIAMRole'
import { expect } from 'chai'

describe.skip(`deleteIAMRole/upsertIAMRole`, function () {
  this.timeout(30000)

  const iam = new IAMClient()
  const properties: UpsertIAMRoleProperties = {
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

  const { RoleName } = properties

  async function cleanup() {
    await deleteIAMRole({ iam, RoleName }).catch((error: unknown) => {
      if (!(error instanceof Error && error.name === 'NoSuchEntityException')) {
        throw error
      }
    })
  }

  beforeEach(cleanup)
  afterEach(cleanup)

  it(`works`, async function () {
    await upsertIAMRole({ ...properties, iam })
    await upsertIAMRole({ ...properties, iam })

    {
      const [{ AttachedPolicies = [] }, { PolicyNames = [] }] =
        await Promise.all([
          iam.send(new ListAttachedRolePoliciesCommand({ RoleName })),
          iam.send(new ListRolePoliciesCommand({ RoleName })),
        ])
      expect(AttachedPolicies.map((p) => p.PolicyArn).sort()).to.deep.equal(
        [...(properties.ManagedPolicyArns || [])].sort()
      )
      expect(PolicyNames.sort()).to.deep.equal(
        (properties.Policies?.map((p) => p.PolicyName) || []).sort()
      )
    }

    const newProperties: UpsertIAMRoleProperties = {
      ...properties,
      ManagedPolicyArns: [
        properties.ManagedPolicyArns![0],
        'arn:aws:iam::aws:policy/AWSCloudFormationReadOnlyAccess',
      ],
      Policies: [
        properties.Policies![0],
        {
          PolicyName: 'CloudWatchAgentPutLogsRetention2',
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

    await upsertIAMRole({ ...newProperties, iam })

    {
      const [{ AttachedPolicies = [] }, { PolicyNames = [] }] =
        await Promise.all([
          iam.send(new ListAttachedRolePoliciesCommand({ RoleName })),
          iam.send(new ListRolePoliciesCommand({ RoleName })),
        ])
      expect(AttachedPolicies.map((p) => p.PolicyArn).sort()).to.deep.equal(
        [...(newProperties.ManagedPolicyArns || [])].sort()
      )
      expect(PolicyNames.sort()).to.deep.equal(
        (newProperties.Policies?.map((p) => p.PolicyName) || []).sort()
      )
    }
  })
})
