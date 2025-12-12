import {
  CloudFormationClient,
  CloudFormationClientConfig,
  StackEvent,
} from '@aws-sdk/client-cloudformation'
import getCurrentStackEvents, {
  isRootStackEvent,
} from './getCurrentStackEvents'
import delay from 'waait'

export default async function* watchStackEvents({
  awsConfig,
  cloudformation,
  StackName,
  since,
  maxAttempts = 3,
  backoff = 2000,
  pollDelay = 500,
  signal,
}: {
  awsConfig?: CloudFormationClientConfig
  cloudformation?: CloudFormationClient
  StackName: string
  since?: number | Date
  maxAttempts?: number
  backoff?: number
  pollDelay?: number
  signal?: AbortSignal
}): AsyncIterableIterator<StackEvent> {
  const initSince = since ? +since : Date.now()
  do {
    let events: StackEvent[] = []
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      events = []
      try {
        for await (const event of getCurrentStackEvents({
          awsConfig,
          cloudformation,
          StackName,
          since,
          signal,
        })) {
          events.push(event)
        }
        break
      } catch (error: any) {
        if (
          error.message.includes(`Stack with id ${StackName} does not exist`)
        ) {
          return
        }
        if (attempt === maxAttempts) {
          return
        }
        await delay(Math.floor(Math.pow(backoff, attempt)))
      }
    }

    // AWS returns events in reverse chronological order,
    // but we want to yield in chronological order so reverse them
    events.reverse()
    for (const event of events) {
      yield event
      // Watch until we reach a complete/failed event for the stack
      if (
        isRootStackEvent(event) &&
        !event.ResourceStatus?.includes('IN_PROGRESS') &&
        event.Timestamp &&
        event.Timestamp.getTime() > initSince
      ) {
        return
      }
      since = event.Timestamp
    }
    await delay(pollDelay)
  } while (!signal?.aborted)
}
