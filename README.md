# @jcoreio/cloudformation-tools

[![CircleCI](https://circleci.com/gh/jcoreio/cloudformation-tools.svg?style=svg)](https://circleci.com/gh/jcoreio/cloudformation-tools)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/%40jcoreio%2Fcloudformation-tools.svg)](https://badge.fury.io/js/%40jcoreio%2Fcloudformation-tools)

# API

- [`deployCloudFormationStack(options)`](#deploycloudformationstackoptions)
- [`deployCloudFormationStacks(options)`](#deploycloudformationstacksoptions)
- [`describeCloudFormationFailure(options)`](#describecloudformationfailureoptions)
- [`getStackOutputs(options)`](#getstackoutputsoptions)
- [`getStackResources(options)`](#getstackresourcesoptions)
- [`getCurrentStackEvents(options)`](#getcurrentstackeventsoptions)
- [`watchStackResources(options)`](#watchstackresourcesoptions)
- [`printStackResources(options)`](#printstackresourcesoptions)

## `deployCloudFormationStack(options)`

```js
import { deployCloudFormationStack } from '@jcoreio/cloudformation-tools'
```

Deploys a stack. Code is adapted from `aws-cli`'s
`deploy` command. However, it can display stack resources
as they are getting created/updated
(if you set `watchResources: true`), and if the update
fails, it will log the failure events.

### `options` object

#### `cloudformation` (`AWS.CloudFormation`, _optional_)

An `AWS.CloudFormation` instance. Will create one with the default options if you don't provide one

#### `watchResources` (`boolean`, _optional_)

If truthy, will watch and print out resource status
while the stack create/update is in progress

#### `watcher` (`StackResourceWatcher`, _optional_)

Alternative to `watchResources`. If given, will watch and print out resource status while the stack create/update is in progress.

#### `region` (`string`, _optional_)

Destination AWS region for CloudFormation stack

#### `approve` (`boolean`, _optional_)

If `true`, lists changes and prompts for approval before deploying. Defaults to `false`.

#### `StackName` (`string`, **required**)

The name or the unique ID of the stack for which you are creating a change set. AWS CloudFormation generates the change set by comparing this stack's information with the information that you submit, such as a modified template or different parameter input values.

#### `TemplateFile` (`string`, _optional_)

The path to the file containing the CloudFormation template. You must specify either `TemplateFile` or
`TemplateBody`.

#### `TemplateBody` (`string`, _optional_)

A structure that contains the body of the revised template, with a minimum length of 1 byte and a maximum length of 51,200 bytes. AWS CloudFormation generates the change set by comparing this template with the template of the stack that you specified.

#### `Parameters` (`{[string]: any} | Array<{ParameterKey: string, ParameterValue: string, UsePreviousValue?: boolean, ResolvedValue?: string}>`, _optional_)

A list of Parameter structures that specify input parameters for the change set.

#### `Capabilities` (`Array<string>`, _optional_)

In some cases, you must explicity acknowledge that your stack template contains certain capabilities in order for AWS CloudFormation to create the stack.

#### `RoleARN` (`string`, _optional_)

The Amazon Resource Name (ARN) of an AWS Identity and Access Management (IAM) role that AWS CloudFormation assumes when executing the change set. AWS CloudFormation uses the role's credentials to make calls on your behalf. AWS CloudFormation uses this role for all future operations on the stack. As long as users have permission to operate on the stack, AWS CloudFormation uses this role even if the users don't have permission to pass it. Ensure that the role grants least privilege.

If you don't specify a value, AWS CloudFormation uses the role that was previously associated with the stack. If no role is available, AWS CloudFormation uses a temporary session that is generated from your user credentials.

#### `NotificationARNs` (`Array<string>`, _optional_)

The Amazon Resource Names (ARNs) of Amazon Simple Notification Service (Amazon SNS) topics that AWS CloudFormation associates with the stack. To remove all associated notification topics, specify an empty list.

#### `Tags` (`{[string]: any} | Array<{Key: string, Value: string}`, _optional_)

Key-value pairs to associate with this stack. AWS CloudFormation also propagates these tags to resources in the stack. You can specify a maximum of 50 tags.

#### `s3` (`{ Bucket: string, prefix?: ?string, SSEKMSKeyId?: ?string, forceUpload?: ?boolean }`, _optional_)

If given, will upload the template body the given S3 bucket.

#### `readOutputs` (`boolean`, _optional_)

If `true`, stack outputs will be read and returned in the `Outputs` property. Defaults to `false`.

#### `replaceIfCreateFailed` (`boolean`, _optional_)

If `true`, will replace an existing stack of the same name if it's in `CREATE_FAILED`, `ROLLBACK_FAILED`,
`ROLLBACK_COMPLETE` or `ROLLBACK_IN_PROGRESS` state (note that these only refer to rollback after
create failure, and are distinct from the `UPDATE_ROLLBACK_...` states)

#### `signalWatchable` (`() => mixed`, _optional_)

If given, this function will be called once the stack create/update is ready to be watched.

### Returns

A `Promise` that resolves or rejects when the deployment succeeds or fails

## `deployCloudFormationStacks(options)`

```js
import { deployCloudFormationStacks } from '@jcoreio/cloudformation-tools'
```

Deploys multiple stacks in parallel.

#### `stacks` (`Array`, **required**)

An array of arguments for `deployCloudFormationStack`, without the other options below or the `approve` option.

#### `cloudformation` (`AWS.CloudFormation`, _optional_)

An `AWS.CloudFormation` instance. Will create one with the default options if you don't provide one

#### `watchResources` (`boolean`, _optional_)

If truthy, will watch and print out resource status
while the stacks are being created or updated.

#### `s3` (`{ Bucket: string, prefix?: ?string, SSEKMSKeyId?: ?string, forceUpload?: ?boolean }`, _optional_)

If given, will upload the template bodies the given S3 bucket.

### Returns

A `Promise` that will resolve after all stacks are deployed successfully, or reject immediately when any stack
deployment fails. If one stack deployment fails, the other deployments will not be canceled.

## `describeCloudFormationFailure(options)`

```js
import { describeCloudFormationFailure } from '@jcoreio/cloudformation-tools'
```

Scans stack events for failures and prints them out
with nice formatting, to help you debug.

### `options` object

#### `cloudformation` (`AWS.CloudFormation`, _optional_)

An `AWS.CloudFormation` instance. Will create one with the default options if you don't provide one

#### `StackName` (`string`, **required**)

The name or unique id of a stack to describe failures for

#### `stream` (`Writable`, _optional_)

The writable stream to output to. Defaults to `process.stderr`.

### Returns

A `Promise` that resolves when done logging, or rejects
if it failed to get stack events

## `getStackOutputs(options)`

```js
import { getStackOutputs } from '@jcoreio/cloudformation-tools'
```

Gets a stack's outputs as an object
instead of an array of `{OutputKey, OutputValue}` objects.

### `options` object

#### `cloudformation` (`AWS.CloudFormation`, _optional_)

An `AWS.CloudFormation` instance. Will create one with the default options if you don't provide one

#### `StackName` (`string`, **required**)

The name or unique id of a stack to get outputs of

### Returns

A `Promise` that resolves to an `{[OutputKey]: OutputValue}` object, or rejects if it failed to get
the outputs.

## `getStackResources(options)`

```js
import { getStackOutputs } from '@jcoreio/cloudformation-tools'
```

Gets all of a stack's resources, handling
the paging for you.

### `options` object

#### `cloudformation` (`AWS.CloudFormation`, _optional_)

An `AWS.CloudFormation` instance. Will create one with the default options if you don't provide one

#### `StackName` (`string`, **required**)

The name or unique id of a stack to get resources of

### Returns

A `Promise` that resolves to array of stack resources,
or rejects if it failed ot get the resources.

## `getCurrentStackEvents(options)`

```js
import { getCurrentStackEvents } from '@jcoreio/cloudformation-tools'
```

Gets all of the events from the most recent changeset,
handling paging for you.

### `options` object

#### `cloudformation` (`AWS.CloudFormation`, _optional_)

An `AWS.CloudFormation` instance. Will create one with the default options if you don't provide one

#### `StackName` (`string`, **required**)

The name or unique id of a stack to get events of

### Returns

A `AsyncIterable` that yields stack events.

## `watchStackResources(options)`

### `options` object

Prints out one or more stacks' resources and their status in a
table every 5 seconds, or on an interval you specify.

#### `cloudformation` (`AWS.CloudFormation`, _optional_)

An `AWS.CloudFormation` instance. Will create one with the default options if you don't provide one

#### `StackName` (`string`, `StackName` or `StackNames` is **required**)

The name or unique id of a stack to watch

#### `StackNames` (`Array<string>`, `StackName` or `StackNames` is **required**)

The names or unique ids of stacks to watch

#### `delay` (`number`, _optional_)

The interval delay in milliseconds

#### `whilePending` (`Promise<any>, _optional_)

If given, the interval will be cleared once this promise resolves or rejects.

### Returns

The interval ID from `setInterval`.

## `printStackResources(options)`

Prints the given resources and their status in a table.

### `options` object

#### `resources` (`Array<Resource>`, **required**)

The resources to print out

#### `stream` (`Writable`, _optional_)

The stream to print to. Defaults to `process.stderr`.

## `upsertSecurityGroup(options)`

Ensures that a security group with the specified name exists in the VPC, creating
it if needed.

### `options` object

#### `securityGroupName` (`string`, **required**)

Name of the security group

#### `securityGroupDescription` (`string`, _optional_)

Description to use when creating the security group

#### `vpcId` (`string`, **required**)

ID of the VPC. Required because security groups exist within a VPC.

#### `ec2` (`AWS.EC2`, **conditional**)

Optional EC2 class instance to use for API calls. If no EC2 class instance
is provided, one will be created using the `region` property. Either
`ec2` or `region` must be provided.

#### `region` (`string`, **conditional**)

AWS region. Either `ec2` or `region` must be provided.

### Returns

A `Promise` that resolves to a `{securityGroupId}` object, or rejects if it failed to
ensure the security group exists.

## `getVPCIdBySubnetId(options)`

Ensures that a security group with the specified name exists in the VPC, creating
it if needed.

### `options` object

#### `subnetId` (`string`, **required**)

ID of the subnet

#### `ec2` (`AWS.EC2`, **conditional**)

Optional EC2 class instance to use for API calls. If no EC2 class instance
is provided, one will be created using the `region` property. Either
`ec2` or `region` must be provided.

#### `region` (`string`, **conditional**)

AWS region. Either `ec2` or `region` must be provided.

### Returns

A `Promise` that resolves to a `string` with the ID of the VPC
