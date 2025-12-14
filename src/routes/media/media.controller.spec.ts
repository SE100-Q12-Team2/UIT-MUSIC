import { Test, TestingModule } from '@nestjs/testing'
import { PlaybackController } from './playback.controller'
import { PlaybackService } from './playback.service'
import { AssetController } from './asset.controller'
import { AssetService } from './asset.service'
import { allure } from '../../../test/allure-helper'

describe('PlaybackController', () => {
  let controller: PlaybackController
  let playbackService: PlaybackService

  beforeAll(() => {
    allure.epic('Media Management');
    allure.feature('Audio Playback');
    allure.owner('Media Team');
  });

  const mockPlaybackService = {
    getPlayBackUrl: jest.fn(),
    signUrl: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaybackController],
      providers: [
        {
          provide: PlaybackService,
          useValue: mockPlaybackService,
        },
      ],
    }).compile()

    controller = module.get<PlaybackController>(PlaybackController)
    playbackService = module.get<PlaybackService>(PlaybackService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('PlayAudio', () => {
    beforeAll(() => {
      allure.story('Get playback URL with quality selection');
    });

    it('Nên lấy URL với chất lượng 128kbps', async () => {
      const songId = '1'
      const query = {
        quality: '128',
      }

      const expectedResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/1/128kbps.mp3?signature=xxx',
        type: 'MP3',
        mime: 'audio/mpeg',
        quality: '128kbps',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      const result = await controller.getPlayback(songId, query)

      expect(result.quality).toBe('128kbps')
      expect(result.url).toContain('128kbps')
    })

    it('Nên lấy URL với HLS streaming', async () => {
      const songId = '1'
      const query = {
        quality: 'hls',
      }

      const expectedResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/1/playlist.m3u8?signature=xxx',
        type: 'HLS',
        mime: 'application/x-mpegURL',
        quality: 'hls',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      const result = await controller.getPlayback(songId, query)

      expect(result.type).toBe('HLS')
      expect(result.mime).toBe('application/x-mpegURL')
      expect(result.url).toContain('.m3u8')
    })
  })
})

describe('AssetController', () => {
  let controller: AssetController
  let assetService: AssetService

  const mockAssetService = {
    createMasterUpload: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        {
          provide: AssetService,
          useValue: mockAssetService,
        },
      ],
    }).compile()

    controller = module.get<AssetController>(AssetController)
    assetService = module.get<AssetService>(AssetService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GenerateAssetURL', () => {
    it('Tạo presigned URL để upload file âm thanh lên cloud storage', async () => {
      const body = {
        songId: 1,
        fileName: 'song-audio.mp3',
        tenant: 'app',
      }

      const expectedResult = {
        ok: true,
        presignedUrl:
          'https://s3.amazonaws.com/bucket/dev/app/track/1/master-abc123.mp3?AWSAccessKeyId=xxx&Expires=xxx&Signature=xxx',
        bucket: 'my-music-bucket',
        key: 'dev/app/track/1/master-abc123.mp3',
        assetId: 1,
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      const result = await controller.presignMaster(body)

      expect(assetService.createMasterUpload).toHaveBeenCalledWith(
        body.songId,
        body.fileName,
        body.tenant
      )
      expect(assetService.createMasterUpload).toHaveBeenCalledTimes(1)
      expect(result.ok).toBe(true)
      expect(result.presignedUrl).toBeDefined()
      expect(result.bucket).toBe('my-music-bucket')
      expect(result.key).toContain('master-')
      expect(result.assetId).toBe(1)
    })

    it('Nên tạo presigned URL cho file FLAC', async () => {
      const body = {
        songId: 2,
        fileName: 'high-quality.flac',
        tenant: 'app',
      }

      const expectedResult = {
        ok: true,
        presignedUrl:
          'https://s3.amazonaws.com/bucket/dev/app/track/2/master-xyz456.flac?AWSAccessKeyId=xxx&Expires=xxx&Signature=xxx',
        bucket: 'my-music-bucket',
        key: 'dev/app/track/2/master-xyz456.flac',
        assetId: 2,
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      const result = await controller.presignMaster(body)

      expect(result.key).toContain('.flac')
      expect(result.ok).toBe(true)
    })
  })
})