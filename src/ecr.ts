import {
  CreateRepositoryCommand,
  DescribeImagesCommand,
  DescribeRepositoriesCommand,
  ECRClient,
  ECRClientConfig,
  GetAuthorizationTokenCommand,
  GetAuthorizationTokenCommandInput,
} from '@aws-sdk/client-ecr'
import {
  fromTemporaryCredentials,
  fromEnv,
} from '@aws-sdk/credential-providers'

import { spawn } from './childProcess'

/* eslint-disable no-console */

export async function loginToECR({
  ecr,
  ...options
}: { ecr?: ECRClient } & GetAuthorizationTokenCommandInput) {
  if (!ecr) ecr = new ECRClient()
  const { authorizationData: [{ authorizationToken, proxyEndpoint }] = [] } =
    await ecr.send(new GetAuthorizationTokenCommand(options))
  if (!authorizationToken || !proxyEndpoint) {
    throw new Error(
      `unexpected: failed to get authorizationToken or proxyEndpoint from getAuthorizationToken response`
    )
  }
  // this is silly...
  const decoded = Buffer.from(authorizationToken, 'base64').toString()
  const [user, password] = decoded.split(/:/)
  const child = spawn(
    'docker',
    ['login', '-u', user, '--password-stdin', proxyEndpoint],
    {
      stdio: 'pipe',
      encoding: 'utf8',
    }
  )
  child.stdin?.write(password)
  child.stdin?.end()
  await child
}

export async function copyECRImage({
  sourceImage,
  destAWSAccountId,
  accessRole,
  externalId,
  ecrOptions,
  forceCopy,
}: {
  sourceImage: string
  destAWSAccountId: string
  accessRole: string
  externalId?: string
  ecrOptions?: ECRClientConfig
  forceCopy?: boolean
}) {
  const match = /(\d+)\.dkr\.ecr\.(.+?)\.amazonaws\.com\/(.+?):(.+)/.exec(
    sourceImage
  )
  if (!match) throw Error(`could not parse source Docker image: ${sourceImage}`)

  const [sourceRegistryId, sourceRegion, repositoryName, imageTag] =
    match.slice(1)

  if (destAWSAccountId === sourceRegistryId) {
    console.error(
      `AWS account ID matches, no need to copy image ${sourceImage}`
    )
    return sourceImage
  }

  const ecrOptionsFinal = ecrOptions || {}
  const ecr = new ECRClient(ecrOptionsFinal)

  const imageExists = await ecr
    .send(
      new DescribeImagesCommand({
        repositoryName,
        imageIds: [{ imageTag }],
      })
    )
    .then(
      () => true,
      () => false
    )

  console.error(
    `image ${imageExists ? 'exists' : 'does not exist'} in your ECR`
  )
  const doCopy = !!forceCopy || !imageExists
  if (doCopy) {
    const externalECROptions: ECRClientConfig = {
      region: sourceRegion,
    }

    if (accessRole) {
      console.error(`Assuming role ${accessRole}...`)
      externalECROptions.credentials = fromTemporaryCredentials({
        masterCredentials: fromEnv(),
        params: {
          RoleArn: accessRole,
          RoleSessionName: 'deploy-monolithic-clarity',
          DurationSeconds: 3600,
          ...(externalId ? { ExternalId: externalId } : {}),
        },
      })
    }
    await loginToECR({
      ecr: new ECRClient({ ...ecrOptionsFinal, ...externalECROptions }),
      registryIds: [sourceRegistryId],
    })

    await spawn('docker', ['pull', sourceImage], { stdio: 'inherit' })
  }

  async function getRepositoryUri() {
    const {
      repositories: [
        { repositoryUri, registryId } = {
          repositoryUri: undefined,
          registryId: undefined,
        },
      ] = [],
    } = await ecr.send(
      new DescribeRepositoriesCommand({ repositoryNames: [repositoryName] })
    )
    return { repositoryUri, registryId }
  }
  let { repositoryUri, registryId } = await getRepositoryUri().catch(() => ({
    repositoryUri: undefined,
    registryId: undefined,
  }))

  if (!repositoryUri) {
    console.error(`creating ECR repository ${repositoryName}...`)
    await ecr.send(new CreateRepositoryCommand({ repositoryName }))
    console.error(`successfully created ECR repo ${repositoryName}`)
    ;({ repositoryUri, registryId } = await getRepositoryUri())
  }
  if (!repositoryUri || !registryId) {
    throw new Error(`failed to get ECR repositoryUri or registryId`)
  }

  const destImage = `${repositoryUri}:${imageTag}`

  if (doCopy) {
    await loginToECR({ ecr, registryIds: [registryId] })
    await spawn('docker', ['tag', sourceImage, destImage])
    await spawn('docker', ['push', destImage], { stdio: 'inherit' })
  }

  return destImage
}
