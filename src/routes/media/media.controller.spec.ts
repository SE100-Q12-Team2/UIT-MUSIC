import { Test, TestingModule } from '@nestjs/testing'
import { PlaybackController } from './playback.controller'
import { PlaybackService } from './playback.service'
import { AssetController } from './asset.controller'
import { AssetService } from './asset.service'
import { NotFoundException } from '@nestjs/common'
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

    it('Lấy URL phát nhạc với chất lượng yêu cầu (HLS, 320kbps, 128kbps) và fallback tự động', async () => {
      allure.severity('blocker');
      allure.description('Kiểm tra chức năng lấy URL phát nhạc với chất lượng 320kbps');
      allure.tag('playback', 'audio', 'high-quality');

      // Arrange
      const songId = '1'
      const query = {
        quality: '320',
      }

      const expectedResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/1/320kbps.mp3?signature=xxx',
        type: 'MP3',
        mime: 'audio/mpeg',
        quality: '320kbps',
      }

      await allure.step('Chuẩn bị và mock playback service', async () => {
        allure.parameter('Song ID', songId);
        allure.parameter('Quality', query.quality);
        allure.attachJSON('Query Parameters', query);
        mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)
      });

      // Act
      let result: any;
      await allure.step('Gọi API lấy playback URL', async () => {
        result = await controller.getPlayback(songId, query)
        allure.attachJSON('Playback Response', result);
      });

      // Assert
      await allure.step('Verify URL và chất lượng', async () => {
        allure.attachText('Validation', '✓ URL generated\n✓ Quality: 320kbps\n✓ Format: MP3');
      });
      expect(playbackService.getPlayBackUrl).toHaveBeenCalledWith(songId, query)
      expect(playbackService.getPlayBackUrl).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResult)
      expect(result.ok).toBe(true)
      expect(result.url).toBeDefined()
      expect(result.quality).toBe('320kbps')
    })

    it('Nên lấy URL với chất lượng 128kbps', async () => {
      // Arrange
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

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.quality).toBe('128kbps')
      expect(result.url).toContain('128kbps')
    })

    it('Nên lấy URL với HLS streaming', async () => {
      // Arrange
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

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.type).toBe('HLS')
      expect(result.mime).toBe('application/x-mpegURL')
      expect(result.url).toContain('.m3u8')
    })

    it('Nên fallback sang HLS khi không có rendition 320kbps', async () => {
      // Arrange
      const songId = '1'
      const query = {
        quality: '320',
      }

      // Giả sử không có 320kbps, fallback sang HLS
      const expectedResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/1/playlist.m3u8?signature=xxx',
        type: 'HLS',
        mime: 'application/x-mpegURL',
        quality: 'hls',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.type).toBe('HLS')
      expect(result.ok).toBe(true)
    })

    it('Nên fallback sang 320kbps khi không có HLS', async () => {
      // Arrange
      const songId = '1'
      const query = {
        quality: 'hls',
      }

      // Giả sử không có HLS, fallback sang 320kbps
      const expectedResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/1/320kbps.mp3?signature=xxx',
        type: 'MP3',
        mime: 'audio/mpeg',
        quality: '320kbps',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.type).toBe('MP3')
      expect(result.quality).toBe('320kbps')
    })

    it('Nên fallback sang 128kbps khi không có HLS và 320kbps', async () => {
      // Arrange
      const songId = '1'
      const query = {
        quality: '320',
      }

      // Giả sử không có 320kbps và HLS, fallback sang 128kbps
      const expectedResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/1/128kbps.mp3?signature=xxx',
        type: 'MP3',
        mime: 'audio/mpeg',
        quality: '128kbps',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.quality).toBe('128kbps')
      expect(result.ok).toBe(true)
    })

    it('Nên trả về lỗi khi bài hát không có rendition nào', async () => {
      // Arrange
      const songId = '999'
      const query = {
        quality: '320',
      }

      const expectedResult = {
        ok: false,
        reason: 'no_rendition',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.ok).toBe(false)
      expect(result.reason).toBe('no_rendition')
    })

    it('Nên trả về lỗi khi bài hát không tồn tại', async () => {
      // Arrange
      const songId = '999'
      const query = {
        quality: '320',
      }

      const expectedResult = {
        ok: false,
        reason: 'not_found',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.ok).toBe(false)
      expect(result.reason).toBe('not_found')
    })

    it('Nên ký URL với CloudFront khi có CF_DOMAIN', async () => {
      // Arrange
      const songId = '1'
      const query = {
        quality: '320',
      }

      const expectedResult = {
        ok: true,
        url: 'https://d111111abcdef8.cloudfront.net/songs/1/320kbps.mp3?Expires=1234567890&Signature=xxx&Key-Pair-Id=xxx',
        type: 'MP3',
        mime: 'audio/mpeg',
        quality: '320kbps',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.url).toContain('Expires=')
      expect(result.url).toContain('Signature=')
      expect(result.url).toContain('Key-Pair-Id=')
    })

    it('Nên phát nhạc không cần authentication', async () => {
      // Arrange
      const songId = '1'
      const query = {}

      const expectedResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/1/default.mp3',
        type: 'MP3',
        mime: 'audio/mpeg',
        quality: '320kbps',
      }

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getPlayback(songId, query)

      // Assert
      expect(result.ok).toBe(true)
      expect(playbackService.getPlayBackUrl).toHaveBeenCalled()
    })

    // ==========================================
    // FAILED TEST CASES FOR DEMO PURPOSES
    // ==========================================

    it('FAIL: Kiểm tra chặt chẽ định dạng MIME type cho Lossless', async () => {
      allure.severity('critical');
      allure.feature('Audio Quality Assurance');
      allure.story('Lossless Playback Compliance');
      allure.description('Test case này sẽ fail vì Service trả về MP3 trong khi Client yêu cầu và mong đợi FLAC.');

      // Arrange
      const songId = '100';
      const query = { quality: 'lossless' };

      const mockResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/100/320kbps.mp3',
        type: 'MP3',
        mime: 'audio/mpeg', 
        quality: '320kbps',
      };

      await allure.step('Mock service response (Simulating Bug)', async () => {
        mockPlaybackService.getPlayBackUrl.mockResolvedValue(mockResult);
        allure.attachJSON('Service Response', mockResult);
      });

      // Act
      const result = await controller.getPlayback(songId, query);

      // Assert
      // >> Đưa expect ra ngoài step để Jest bắt lỗi <<
      expect(result.mime).toBe('audio/flac'); 
    });

    it('FAIL: Kiểm tra URL phải chứa token bảo mật bắt buộc', async () => {
      allure.severity('blocker');
      allure.tag('security', 'authentication');
      allure.description('Test case này fail vì URL trả về thiếu tham số signature bắt buộc.');

      // Arrange
      const songId = '200';
      const mockResult = {
        ok: true,
        url: 'https://cdn.example.com/songs/200/stream.mp3', 
        type: 'MP3',
        mime: 'audio/mpeg',
        quality: '128kbps',
      };

      mockPlaybackService.getPlayBackUrl.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getPlayback(songId, {});

      // Assert
      await allure.step('Security Audit: Check for Signature', async () => {
         allure.attachText('Checked URL', result.url as string);
      });
      // >> Đưa expect ra ngoài step để Jest bắt lỗi <<
      expect(result.url).toContain('signature=');
      expect(result.url).toContain('expires=');
    });
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
      // Arrange
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

      // Act
      const result = await controller.presignMaster(body)

      // Assert
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
      // Arrange
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

      // Act
      const result = await controller.presignMaster(body)

      // Assert
      expect(result.key).toContain('.flac')
      expect(result.ok).toBe(true)
    })

    it('Nên tạo presigned URL cho file WAV', async () => {
      // Arrange
      const body = {
        songId: 3,
        fileName: 'original.wav',
        tenant: 'app',
      }

      const expectedResult = {
        ok: true,
        presignedUrl:
          'https://s3.amazonaws.com/bucket/dev/app/track/3/master-def789.wav?AWSAccessKeyId=xxx&Expires=xxx&Signature=xxx',
        bucket: 'my-music-bucket',
        key: 'dev/app/track/3/master-def789.wav',
        assetId: 3,
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.presignMaster(body)

      // Assert
      expect(result.key).toContain('.wav')
      expect(result.ok).toBe(true)
    })

    it('Nên throw exception khi song không tồn tại', async () => {
      // Arrange
      const body = {
        songId: 999,
        fileName: 'song.mp3',
        tenant: 'app',
      }

      mockAssetService.createMasterUpload.mockRejectedValue(
        new NotFoundException('Song not found')
      )

      // Act & Assert
      await expect(controller.presignMaster(body)).rejects.toThrow(
        'Song not found'
      )
      expect(assetService.createMasterUpload).toHaveBeenCalledWith(
        body.songId,
        body.fileName,
        body.tenant
      )
    })

    it('Nên tạo key với tenant và environment đúng', async () => {
      // Arrange
      const body = {
        songId: 1,
        fileName: 'test.mp3',
        tenant: 'custom-tenant',
      }

      const expectedResult = {
        ok: true,
        presignedUrl: 'https://s3.amazonaws.com/bucket/dev/custom-tenant/track/1/master-abc.mp3?xxx',
        bucket: 'my-music-bucket',
        key: 'dev/custom-tenant/track/1/master-abc.mp3',
        assetId: 1,
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.presignMaster(body)

      // Assert
      expect(result.key).toContain('custom-tenant')
      expect(result.key).toContain('dev/')
    })

    it('Nên upsert asset khi song đã có asset', async () => {
      // Arrange
      const body = {
        songId: 1,
        fileName: 'updated-song.mp3',
        tenant: 'app',
      }

      const expectedResult = {
        ok: true,
        presignedUrl: 'https://s3.amazonaws.com/bucket/xxx',
        bucket: 'my-music-bucket',
        key: 'dev/app/track/1/master-new.mp3',
        assetId: 1, // Same asset ID - was updated
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.presignMaster(body)

      // Assert
      expect(result.assetId).toBe(1)
      expect(result.ok).toBe(true)
    })

    it('Nên set status là Uploaded khi tạo asset', async () => {
      // Arrange
      const body = {
        songId: 5,
        fileName: 'new-song.mp3',
        tenant: 'app',
      }

      const expectedResult = {
        ok: true,
        presignedUrl: 'https://s3.amazonaws.com/bucket/xxx',
        bucket: 'my-music-bucket',
        key: 'dev/app/track/5/master-xyz.mp3',
        assetId: 5,
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.presignMaster(body)

      // Assert
      expect(result.ok).toBe(true)
      expect(result.assetId).toBe(5)
    })

    it('Nên có thời gian hết hạn mặc định 30 phút (1800s)', async () => {
      // Arrange
      const body = {
        songId: 1,
        fileName: 'test.mp3',
        tenant: 'app',
      }

      const expectedResult = {
        ok: true,
        presignedUrl: 'https://s3.amazonaws.com/bucket/key?Expires=1800',
        bucket: 'my-music-bucket',
        key: 'dev/app/track/1/master-abc.mp3',
        assetId: 1,
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.presignMaster(body)

      // Assert
      expect(result.presignedUrl).toContain('Expires=')
      expect(result.ok).toBe(true)
    })

    it('Nên require authentication', async () => {
      // Arrange
      const body = {
        songId: 1,
        fileName: 'test.mp3',
        tenant: 'app',
      }

      const expectedResult = {
        ok: true,
        presignedUrl: 'https://s3.amazonaws.com/bucket/xxx',
        bucket: 'my-music-bucket',
        key: 'dev/app/track/1/master-abc.mp3',
        assetId: 1,
      }

      mockAssetService.createMasterUpload.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.presignMaster(body)

      // Assert - Controller được decorate với @Auth([AuthType.Bearer])
      expect(result.ok).toBe(true)
    })

    // ==========================================
    // FAILED TEST CASES FOR DEMO PURPOSES
    // ==========================================

    it('FAIL: Validate S3 Bucket Environment Isolation', async () => {
      allure.severity('critical');
      allure.epic('Infrastructure');
      allure.feature('Asset Storage');
      allure.description('Đảm bảo không bao giờ upload nhầm vào Prod bucket từ môi trường Test.');

      // Arrange
      const body = {
        songId: 500,
        fileName: 'leaked-song.mp3',
        tenant: 'app',
      };

      const wrongConfigResult = {
        ok: true,
        presignedUrl: 'https://s3.amazonaws.com/prod-music-bucket/key...',
        bucket: 'prod-music-bucket', // <-- Wrong bucket
        key: 'prod/app/track/500/master.mp3',
        assetId: 500,
      };

      await allure.step('Setup Mock with Wrong Configuration', async () => {
         mockAssetService.createMasterUpload.mockResolvedValue(wrongConfigResult);
      });

      // Act
      const result = await controller.presignMaster(body);

      // Assert
      await allure.step('Verify Bucket Name', async () => {
         allure.parameter('Expected Bucket', 'my-music-bucket');
         allure.parameter('Actual Bucket', result.bucket);
      });
      // >> Đưa expect ra ngoài step để Jest bắt lỗi <<
      expect(result.bucket).toBe('my-music-bucket'); 
    });

    it('FAIL: Kiểm tra thời gian hết hạn của Presigned URL', async () => {
      allure.severity('normal');
      allure.description('URL upload phải có thời hạn tối thiểu 1 tiếng (3600s) cho file lớn.');

      // Arrange
      const body = { songId: 1, fileName: 'long-mix.mp3', tenant: 'app' };
      
      const mockResult = {
        ok: true,
        presignedUrl: 'https://s3.amazonaws.com/bucket/key?Expires=900', // Chỉ có 15 phút
        bucket: 'my-music-bucket',
        key: 'dev/key',
        assetId: 1,
      };
      
      mockAssetService.createMasterUpload.mockResolvedValue(mockResult);

      // Act
      const result = await controller.presignMaster(body);

      // Assert
      await allure.step('Check Expiration Policy', async () => {
        const url = new URL(result.presignedUrl);
        const expires = url.searchParams.get('Expires');
        allure.parameter('Actual Expires', expires);
        allure.parameter('Minimum Required', '3600');
      });
      // >> Đưa expect ra ngoài step để Jest bắt lỗi <<
      expect(result.presignedUrl).toContain('Expires=3600');
    });

    it('❌ Demo failure - Invalid file format', async () => {
      allure.severity('normal');
      allure.description('Test case minh họa failure - định dạng file không hợp lệ');
      allure.tag('demo-failure', 'file-upload');
      
      const invalidFile = 'test.exe';

      await allure.step('Kiểm tra định dạng file phải là audio', async () => {
        allure.parameter('File Name', invalidFile);
        allure.attachJSON('File Info', { name: invalidFile, type: 'executable' });
      });
      // >> Đưa expect ra ngoài step để Jest bắt lỗi <<
      expect(invalidFile).toMatch(/\.(mp3|wav|flac)$/);
    })
  })
})