// index.mjs
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { createWriteStream, promises as fs } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const s3 = new S3Client({})
const execFileAsync = promisify(execFile)

const FFMPEG = process.env.FFMPEG_PATH ?? '/opt/bin/ffmpeg'
const FFPROBE = process.env.FFPROBE_PATH ?? '/opt/bin/ffprobe'

const isMaster = (key) => /\/master-[^/]+\.(flac|wav|mp3|mp4)$/i.test(key)
const getSongId = (key) => {
  const parts = key.split('/')
  const i = parts.findIndex((p) => p === 'track')
  return i >= 0 && parts[i + 1] ? Number(parts[i + 1]) : NaN
}

async function downloadToTmp(bucket, key, tmpPath) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  await pipeline(res.Body, createWriteStream(tmpPath))
}

async function probeDurationSec(inputPath) {
  const { stdout } = await execFileAsync(FFPROBE, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    inputPath,
  ])
  const dur = parseFloat((stdout || '').trim())
  return Number.isFinite(dur) ? Math.round(dur) : 0
}

async function transcodeMp3(inputPath, bitrateKbps, outPath) {
  await execFileAsync(FFMPEG, [
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-ac',
    '2',
    '-ar',
    '44100',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    `${bitrateKbps}k`,
    outPath,
  ])
}

async function transcodeHls(inputPath, outDir) {
  await fs.mkdir(outDir, { recursive: true })
  const playlistPath = `${outDir}/playlist.m3u8`
  await execFileAsync(FFMPEG, [
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-ac',
    '2',
    '-ar',
    '44100',
    '-codec:a',
    'aac',
    '-b:a',
    '128k',
    '-hls_time',
    '6',
    '-hls_playlist_type',
    'vod',
    '-hls_segment_filename',
    `${outDir}/seg_%03d.ts`,
    playlistPath,
  ])
  return { playlistPath }
}

async function uploadFile(bucket, key, filePath, contentType, cacheControl = 'public, max-age=31536000, immutable') {
  const body = await fs.readFile(filePath)
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  )
  return body.length
}

async function postWithRetry(url, init, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, i)))
    }
  }
  throw lastErr
}

export const handler = async (event) => {
  console.log('S3 event:', JSON.stringify(event, null, 2))

  for (const rec of event.Records ?? []) {
    try {
      const ingestBucket = rec.s3.bucket.name
      const key = decodeURIComponent(rec.s3.object.key.replace(/\+/g, ' '))

      if (!isMaster(key)) {
        console.log('Skip non-master object:', key)
        continue
      }

      const songId = getSongId(key)
      if (!Number.isFinite(songId)) {
        console.warn('Cannot parse songId from key:', key)
        continue
      }

      if (!process.env.INGEST_CALLBACK_URL || !process.env.INGEST_TOKEN) {
        console.error('Missing env INGEST_CALLBACK_URL / INGEST_TOKEN')
        continue
      }

      const MEDIA_BUCKET = process.env.MEDIA_BUCKET || ingestBucket

      // 1) Tải master về /tmp
      const uid = randomUUID().slice(0, 8)
      const tmpMaster = `/tmp/master-${uid}`
      await downloadToTmp(ingestBucket, key, tmpMaster)

      // 2) ffprobe duration
      let durationSec = 0
      try {
        durationSec = await probeDurationSec(tmpMaster)
      } catch (e) {
        console.warn('ffprobe failed, set duration=0', e?.message)
      }

      // 3) Transcode MP3 128/320
      const tmp128 = `/tmp/out-128-${uid}.mp3`
      const tmp320 = `/tmp/out-320-${uid}.mp3`
      await transcodeMp3(tmpMaster, 128, tmp128)
      await transcodeMp3(tmpMaster, 320, tmp320)

      // 4) Transcode HLS
      const tmpHlsDir = `/tmp/hls-${uid}`
      await transcodeHls(tmpMaster, tmpHlsDir)

      // 5) Upload renditions
      const basePrefix = key.replace(/master-[^/]+$/, '')
      const mp3Key128 = `${basePrefix}mp3-128-${uid}.mp3`
      const mp3Key320 = `${basePrefix}mp3-320-${uid}.mp3`
      const hlsPrefix = `${basePrefix}hls-${uid}/`
      const hlsPlaylistKey = `${hlsPrefix}playlist.m3u8`

      const size128 = await uploadFile(MEDIA_BUCKET, mp3Key128, tmp128, 'audio/mpeg')
      const size320 = await uploadFile(MEDIA_BUCKET, mp3Key320, tmp320, 'audio/mpeg')

      const hlsFiles = await fs.readdir(tmpHlsDir)
      for (const fname of hlsFiles) {
        const fpath = `${tmpHlsDir}/${fname}`
        const isPlaylist = fname.endsWith('.m3u8')
        const mime = isPlaylist ? 'application/vnd.apple.mpegurl' : 'video/mp2t'
        await uploadFile(MEDIA_BUCKET, `${hlsPrefix}${fname}`, fpath, mime)
      }

      // 6) Callback
      const payload = {
        songId,
        masterKey: key,
        masterBucket: ingestBucket,
        durationSec,
        renditions: [
          {
            type: 'MP3',
            quality: 'Q128kbps',
            bitrateKbps: 128,
            bucket: MEDIA_BUCKET,
            key: mp3Key128,
            mime: 'audio/mpeg',
            sizeBytes: size128,
          },
          {
            type: 'MP3',
            quality: 'Q320kbps',
            bitrateKbps: 320,
            bucket: MEDIA_BUCKET,
            key: mp3Key320,
            mime: 'audio/mpeg',
            sizeBytes: size320,
          },
          {
            type: 'HLS',
            quality: 'Q128kbps',
            bucket: MEDIA_BUCKET,
            key: hlsPlaylistKey,
            mime: 'application/vnd.apple.mpegurl',
            hlsSegmentPrefix: hlsPrefix,
          },
        ],
      }

      console.log('Callback payload:', JSON.stringify(payload))

      const res = await postWithRetry(process.env.INGEST_CALLBACK_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ingest-token': process.env.INGEST_TOKEN,
        },
        body: JSON.stringify(payload),
      })

      console.log('Callback status:', res.status)
      console.log('Callback body:', await res.text())

      await fs.rm(tmpMaster, { force: true })
      await fs.rm(tmp128, { force: true })
      await fs.rm(tmp320, { force: true })
      await fs.rm(tmpHlsDir, { recursive: true, force: true })
    } catch (err) {
      console.error('Error handling record:', err)
    }
  }

  return { ok: true }
}
