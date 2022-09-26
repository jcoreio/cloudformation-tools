const AWS = require('aws-sdk')

const { spawn } = require('./childProcess')

/* eslint-disable no-console */

async function loginToECR({ ecr, ...options }) {
  if (!ecr) ecr = new AWS.ECR()
  const {
    authorizationData: [{ authorizationToken, proxyEndpoint }],
  } = await ecr.getAuthorizationToken(options).promise()
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
  child.stdin.write(password)
  child.stdin.end()
  await child
}

async function copyECRImage({
  sourceImage,
  destAWSAccountId,
  accessRole,
  externalId,
  ecrOptions,
  forceCopy,
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
  const ecr = new AWS.ECR(ecrOptionsFinal)

  let imageExists = false
  await ecr
    .describeImages({
      repositoryName,
      imageIds: [{ imageTag }],
    })
    .promise()
    .then(
      () => (imageExists = true),
      () => (imageExists = false)
    )

  console.error(
    `image ${imageExists ? 'exists' : 'does not exist'} in your ECR`
  )
  const doCopy = !!forceCopy || !imageExists
  if (doCopy) {
    const externalECROptions = { region: sourceRegion }

    if (accessRole) {
      console.error(`Assuming role ${accessRole}...`)
      externalECROptions.credentials = new AWS.TemporaryCredentials(
        {
          RoleArn: accessRole,
          RoleSessionName: 'deploy-monolithic-clarity',
          DurationSeconds: 3600,
          ...(externalId ? { ExternalId: externalId } : {}),
        },
        // Explicitly pass in EnvironmentCredentials so the SDK doesn't crash
        // in cases where there's no global AWS config
        new AWS.EnvironmentCredentials('AWS')
      )
    }
    await loginToECR({
      ecr: new AWS.ECR({ ...ecrOptionsFinal, ...externalECROptions }),
      registryIds: [sourceRegistryId],
    })

    await spawn('docker', ['pull', sourceImage], { stdio: 'inherit' })
  }

  let repositoryUri = null
  let registryId = null
  async function getRepositoryUri() {
    ;({
      repositories: [{ repositoryUri, registryId }],
    } = await ecr
      .describeRepositories({ repositoryNames: [repositoryName] })
      .promise())
  }
  try {
    await getRepositoryUri()
  } catch (error) {
    // ignore
  }

  if (!repositoryUri) {
    console.error(`creating ECR repository ${repositoryName}...`)
    await ecr.createRepository({ repositoryName }).promise()
    console.error(`successfully created ECR repo ${repositoryName}`)
    await getRepositoryUri()
  }

  const destImage = `${repositoryUri}:${imageTag}`

  if (doCopy) {
    await loginToECR({ ecr, registryIds: [registryId] })
    await spawn('docker', ['tag', sourceImage, destImage])
    await spawn('docker', ['push', destImage], { stdio: 'inherit' })
  }

  return destImage
}

module.exports = { copyECRImage }
