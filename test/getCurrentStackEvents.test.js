/**
 * @prettier
 */

import { getCurrentStackEvents } from '../src'
import { describe, it } from 'mocha'
import { expect } from 'chai'

describe(`getCurrentStackEvents`, function () {
  it(`works`, async function (): Promise<void> {
    const events = [
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T22:11:34.412Z',
        ResourceStatus: 'UPDATE_COMPLETE',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T22:11:33.430Z',
        ResourceStatus: 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T22:11:15.785Z',
        ResourceStatus: 'UPDATE_IN_PROGRESS',
        ResourceStatusReason: 'User Initiated',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:58:20.357Z',
        ResourceStatus: 'UPDATE_ROLLBACK_COMPLETE',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:58:14.458Z',
        ResourceStatus: 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:57:59.697Z',
        ResourceStatus: 'UPDATE_ROLLBACK_IN_PROGRESS',
        ResourceStatusReason:
          'Parameter validation failed: parameter value undefined for parameter name DBSecurityGroup does not exist, parameter value undefined for parameter name RedisSecurityGroup does not exist, parameter value undefined for parameter name HistorianDBServersAccessSecurityGroup does not exist',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:57:56.642Z',
        ResourceStatus: 'UPDATE_IN_PROGRESS',
        ResourceStatusReason: 'User Initiated',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:51:29.134Z',
        ResourceStatus: 'UPDATE_ROLLBACK_COMPLETE',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:51:28.086Z',
        ResourceStatus: 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:51:10.843Z',
        ResourceStatus: 'UPDATE_ROLLBACK_IN_PROGRESS',
        ResourceStatusReason:
          'Parameter validation failed: parameter value undefined for parameter name DBSecurityGroup does not exist, parameter value undefined for parameter name RedisSecurityGroup does not exist, parameter value undefined for parameter name HistorianDBServersAccessSecurityGroup does not exist',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:51:07.252Z',
        ResourceStatus: 'UPDATE_IN_PROGRESS',
        ResourceStatusReason: 'User Initiated',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:42:41.351Z',
        ResourceStatus: 'UPDATE_ROLLBACK_COMPLETE',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:42:40.462Z',
        ResourceStatus: 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:42:24.977Z',
        ResourceStatus: 'UPDATE_ROLLBACK_IN_PROGRESS',
        ResourceStatusReason:
          'Parameter validation failed: parameter value undefined for parameter name DBSecurityGroup does not exist, parameter value undefined for parameter name RedisSecurityGroup does not exist, parameter value undefined for parameter name HistorianDBServersAccessSecurityGroup does not exist',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-22T21:42:22.358Z',
        ResourceStatus: 'UPDATE_IN_PROGRESS',
        ResourceStatusReason: 'User Initiated',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-21T23:25:10.407Z',
        ResourceStatus: 'UPDATE_COMPLETE',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-21T23:25:09.537Z',
        ResourceStatus: 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-21T23:25:01.465Z',
        ResourceStatus: 'UPDATE_IN_PROGRESS',
        ResourceStatusReason: 'User Initiated',
      },
      {
        StackId: 'XXXX',
        EventId: 'XXXX',
        StackName: 'clarity-master',
        LogicalResourceId: 'clarity-master',
        PhysicalResourceId: 'XXXX',
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: '2019-01-21T23:21:08.434Z',
        ResourceStatus: 'UPDATE_COMPLETE',
      },
    ]
    const cloudformation = {
      describeStackEvents({ StackName, NextToken }) {
        return {
          async promise() {
            const start = NextToken || 0
            const end = Math.min(events.length, start + 3)
            const StackEvents = events.slice(start, end)
            return { StackEvents, NextToken: end < events.length ? end : null }
          },
        }
      },
    }

    const currentEvents = []
    for await (let event of getCurrentStackEvents({
      cloudformation,
      StackName: 'foo',
    })) {
      currentEvents.push(event)
    }

    expect(currentEvents).to.deep.equal(events.slice(0, 3))
  })
})
