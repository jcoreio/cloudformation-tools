import { Writable } from 'stream'

type Resource = {
  LogicalResourceId: string
  ResourceType: string
  ResourceStatus: string
  ResourceStatusReason?: string
}

export default function printStackResources(options: {
  stream?: Writable | null | undefined
  resources: Resource[]
}): Promise<void>
