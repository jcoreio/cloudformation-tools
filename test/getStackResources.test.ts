import { getStackResources } from '../src'
import { describe, it } from 'mocha'
import { expect } from 'chai'

describe(`getStackResources`, function () {
  it(`works`, async function (): Promise<void> {
    const resources = [
      {
        LogicalResourceId: 'AppTaskDefinition',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::TaskDefinition',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:37.057Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'CloudwatchLogsGroup',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::Logs::LogGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:31.763Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'DBInstanceSecurityGroupIngress',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::EC2::SecurityGroupIngress',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:42.154Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'DataSweeperService',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::Service',
        LastUpdatedTimestamp: new Date('2019-01-18T05:29:44.054Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'DataSweeperTaskDefinition',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::TaskDefinition',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:37.384Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ECSAutoScalingGroup',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::AutoScaling::AutoScalingGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:28:31.110Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ECSCluster',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::Cluster',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:29.880Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ECSInstanceProfile',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::IAM::InstanceProfile',
        LastUpdatedTimestamp: new Date('2019-01-18T05:26:53.601Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ECSLaunchConfiguration',
        PhysicalResourceId: 'clarity-ECSLaunchConfiguration-1PT4JRTP01C18',
        ResourceType: 'AWS::AutoScaling::LaunchConfiguration',
        LastUpdatedTimestamp: new Date('2019-01-18T05:26:59.731Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ECSRole',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::IAM::Role',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:48.473Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ECSSecurityGroup',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::EC2::SecurityGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:36.600Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ECSServiceAutoScalingRole',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::IAM::Role',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:46.941Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'HTTPListener',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ElasticLoadBalancingV2::Listener',
        LastUpdatedTimestamp: new Date('2019-01-18T05:27:09.288Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'HTTPSListener',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ElasticLoadBalancingV2::Listener',
        LastUpdatedTimestamp: new Date('2019-01-18T05:27:08.525Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'HTTPSService',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::Service',
        LastUpdatedTimestamp: new Date('2019-01-18T05:29:13.759Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'HTTPSTargetGroup',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ElasticLoadBalancingV2::TargetGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:31.998Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'HTTPService',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::Service',
        LastUpdatedTimestamp: new Date('2019-01-18T05:29:15.148Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'HTTPTargetGroup',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ElasticLoadBalancingV2::TargetGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:31.377Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'HTTPTaskDefinition',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::TaskDefinition',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:36.877Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'MQTTSListener',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ElasticLoadBalancingV2::Listener',
        LastUpdatedTimestamp: new Date('2019-01-18T05:27:08.742Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'MQTTSService',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::Service',
        LastUpdatedTimestamp: new Date('2019-01-18T05:29:15.121Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'MQTTSTargetGroup',
        PhysicalResourceId:
          'arn:aws:elasticloadbalancing:us-west-2:052972125574:targetgroup/clarity-mqtts/8f9fb91082bda08c',
        ResourceType: 'AWS::ElasticLoadBalancingV2::TargetGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:31.454Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'MQTTSTaskDefinition',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::TaskDefinition',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:37.060Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'NetworkLoadBalancer',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
        LastUpdatedTimestamp: new Date('2019-01-18T05:27:03.708Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'NotificationSenderService',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::Service',
        LastUpdatedTimestamp: new Date('2019-01-18T05:29:43.571Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'NotificationSenderTaskDefinition',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::ECS::TaskDefinition',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:37.078Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'PrivateDNSRecord',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::Route53::RecordSetGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:28:11.542Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'PublicDNSRecord',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::Route53::RecordSetGroup',
        LastUpdatedTimestamp: new Date('2019-01-18T05:27:40.914Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'RedisSecurityGroupIngress',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::EC2::SecurityGroupIngress',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:42.208Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
      {
        LogicalResourceId: 'ServiceRole',
        PhysicalResourceId: 'XXXXX',
        ResourceType: 'AWS::IAM::Role',
        LastUpdatedTimestamp: new Date('2019-01-18T05:24:41.257Z'),
        ResourceStatus: 'CREATE_COMPLETE',
        DriftInformation: { StackResourceDriftStatus: 'NOT_CHECKED' },
      },
    ]
    const cloudformation = {
      listStackResources({
        NextToken,
      }: AWS.CloudFormation.ListStackResourcesInput) {
        return {
          async promise() {
            const start = parseInt(NextToken || '0')
            const end = Math.min(resources.length, start + 3)
            const StackResourceSummaries = resources.slice(start, end)
            return {
              StackResourceSummaries,
              NextToken: end < resources.length ? end : null,
            }
          },
        }
      },
    }
    expect(
      await getStackResources({
        // @ts-expect-error mock
        cloudformation,
        StackName: 'foo',
      })
    ).to.deep.equal(resources)
  })
})
