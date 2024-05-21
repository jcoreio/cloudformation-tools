import { getStackOutputs } from '../src'
import { describe, it } from 'mocha'
import { expect } from 'chai'

describe(`getStackOutputs`, function () {
  it(`works`, async function (): Promise<void> {
    const result = {
      Stacks: [
        {
          StackId: 'XXXX',
          StackName: 'clarity',
          ChangeSetId: 'XXXX',
          Description: 'Creates AWS Resources Needed to Run the Clarity',
          Parameters: [],
          CreationTime: '2019-01-18T05:24:18.418Z',
          LastUpdatedTime: '2019-01-18T05:24:24.003Z',
          RollbackConfiguration: {},
          StackStatus: 'CREATE_COMPLETE',
          DisableRollback: false,
          NotificationARNs: [],
          Capabilities: ['CAPABILITY_NAMED_IAM'],
          Outputs: [
            {
              OutputKey: 'HTTPSService',
              OutputValue: 'foo',
            },
            {
              OutputKey: 'MQTTSService',
              OutputValue: 'bar',
            },
            {
              OutputKey: 'AppTaskDefinition',
              OutputValue: 'baz',
            },
            {
              OutputKey: 'NetworkLoadBalancer',
              OutputValue: 'qux',
              Description: 'A reference to the Network Load Balancer',
            },
          ],
          Tags: [],
          EnableTerminationProtection: false,
        },
      ],
    }

    const cloudformation = {
      describeStacks() {
        return {
          async promise() {
            return result
          },
        }
      },
    }
    expect(
      await getStackOutputs({
        // @ts-expect-error mock
        cloudformation,
        StackName: 'clarity',
      })
    ).to.deep.equal({
      HTTPSService: 'foo',
      MQTTSService: 'bar',
      AppTaskDefinition: 'baz',
      NetworkLoadBalancer: 'qux',
    })
  })
})
