import { Readable } from 'stream'
import { Upload } from '@aws-sdk/lib-storage'
import crypto from 'crypto'
import {
  GetBucketLocationCommand,
  HeadObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'

type Options = {
  Bucket: string
  prefix?: string
  SSEKMSKeyId?: string
  forceUpload?: boolean
  s3: S3Client
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
  if (typeof data !== 'function') {
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
    | undefined

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
    const params: PutObjectCommandInput = {
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
    const upload = new Upload({
      client: s3,
      params,
    })

    upload.on('httpUploadProgress', ({ loaded, total }) => {
      const percentage =
        loaded != null && total ? ((loaded / total) * 100).toFixed(2) : '?'
      /* eslint-disable no-console */
      console.error(
        `Uploading to ${Key}  ${loaded} / ${total || '?'}  (${percentage}%)`
      )
      /* eslint-enable no-console */
    })
    await upload.done()
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
      .send(
        new HeadObjectCommand({
          Bucket,
          Key,
        })
      )
      .then(
        () => true,
        () => false
      )
  }
  makeUrl(Key: string): string {
    const { Bucket } = this._options
    return `s3://${Bucket}/${Key}`
  }
  async toPathStyleS3Url(Key: string, version?: string): Promise<string> {
    const { s3, Bucket } = this._options

    const { LocationConstraint } = await s3.send(
      new GetBucketLocationCommand({ Bucket })
    )
    const endpoint = `s3${
      LocationConstraint ? `.${LocationConstraint}` : ''
    }.amazonaws.com`

    return `https://${endpoint}/${Bucket}/${Key}${
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
