/**
 * @prettier
 */

import AWS from 'aws-sdk'
import { Writable } from 'stream'

export default function printStackEvents(options: {
  events: AsyncIterable<AWS.CloudFormation.StackEvent>
  out?: Writable
  printHeader?: boolean
}): Promise<void>
