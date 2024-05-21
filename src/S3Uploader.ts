import AWS from 'aws-sdk'
import { Readable } from 'stream'
import crypto from 'crypto'

type Options = {
  Bucket: string
  prefix?: string | undefined
  SSEKMSKeyId?: string | undefined
  forceUpload?: boolean | undefined
  s3: AWS.S3
}
type UploadOptions = {
  Body: Buffer | string | Readable
  Key: string
}
type UploadWithDedupOptions = {
  Body: Buffer | string | (() => Readable)
  extension?: string | undefined
}
async function checksum(
  data: Buffer | string | (() => Readable)
): Promise<string> {
  const hash = crypto.createHash('md5')
  if (data instanceof Buffer || typeof data === 'string') {
    hash.update(data)
    return hash.digest('hex')
  }
  const input = data()
  return new Promise(
    (resolve: (arg1: string) => any, reject: (arg1: Error) => any) => {
      input.on('error', (error: Error) => {
        input.removeAllListeners()
        reject(error)
      })
      input.on('readable', () => {
        const data = input.read()
        if (data) hash.update(data)
        else resolve(hash.digest('hex'))
      })
    }
  )
}
export default class S3Uploader {
  _options: Options
  Metadata:
    | {
        [key: string]: string
      }
    | null
    | undefined = null
  constructor(options: Options) {
    this._options = options
  }
  async upload({ Body, Key }: UploadOptions): Promise<string> {
    const { prefix, forceUpload, s3, Bucket, SSEKMSKeyId } = this._options
    if (prefix) Key = `${prefix}/${Key}`
    if (!forceUpload && (await this.fileExists(Key))) {
      /* eslint-disable no-console */
      console.error(
        `File with same data already exists at ${Key}. Skipping upload`
      )
      /* eslint-enable no-console */

      return this.makeUrl(Key)
    }
    const params: {
      Bucket: string
      Key: string
      Body: Buffer | string | Readable
      ServerSideEncryption: string
      SSEKMSKeyId?: string
      Metadata?: {
        [key: string]: string
      }
    } = {
      Bucket,
      Key,
      Body,
      ServerSideEncryption: 'AES256',
    }
    if (SSEKMSKeyId) {
      params.ServerSideEncryption = 'aws:kms'
      params.SSEKMSKeyId = SSEKMSKeyId
    }
    if (this.Metadata) {
      params.Metadata = this.Metadata
    }
    const uploader = s3.upload(params)
    uploader.on(
      'httpUploadProgress',
      ({
        loaded,
        total,
      }: {
        loaded: number
        total?: number | null | undefined
      }) => {
        const percentage = total ? ((loaded / total) * 100).toFixed(2) : '?'
        /* eslint-disable no-console */
        console.error(
          `Uploading to ${Key}  ${loaded} / ${total || '?'}  (${percentage}%)`
        )
        /* eslint-enable no-console */
      }
    )
    await uploader.promise()
    return this.makeUrl(Key)
  }
  async uploadWithDedup({
    Body,
    extension,
  }: UploadWithDedupOptions): Promise<string> {
    const md5 = await checksum(Body)
    const Key = md5 + (extension ? `.${extension}` : '')
    return this.upload({
      Body: typeof Body === 'function' ? Body() : Body,
      Key,
    })
  }
  async fileExists(Key: string): Promise<boolean> {
    const { Bucket, s3 } = this._options
    return await s3
      .headObject({
        Bucket,
        Key,
      })
      .promise()
      .then(
        () => true,
        () => false
      )
  }
  makeUrl(Key: string): string {
    const { Bucket } = this._options
    return `s3://${Bucket}/${Key}`
  }
  toPathStyleS3Url(Key: string, version?: string): string {
    const { s3, Bucket } = this._options
    return `http://${s3.config.endpoint}/${Bucket}/${Key}${
      version ? `?versionId=${version}` : ''
    }`
  }
}
export type ParsedS3URL = {
  Bucket: string
  Key: string
  versionId?: string
}
export function parseS3Url(url: string): ParsedS3URL {
  const { protocol, host, pathname, searchParams } = new URL(url)
  if ('s3:' !== protocol || !host || !pathname) {
    throw new Error(`invalid S3 url: ${url}`)
  }
  const result: ParsedS3URL = {
    Bucket: host,
    Key: pathname.replace(/^\//, ''),
  }
  const versionId = searchParams.get('versionId')
  if (versionId) result.versionId = versionId
  return result
}
