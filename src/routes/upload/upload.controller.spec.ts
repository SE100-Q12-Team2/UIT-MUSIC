import { Test, TestingModule } from '@nestjs/testing'
import { UploadController } from './upload.controller'
import { UploadService } from './upload.service'
import { S3IngestService } from 'src/shared/services/s3.service'

describe('UploadController', () => {
  let controller: UploadController
  let service: UploadService

  const mockS3Service = {
    generatePresignedUrl: jest.fn(),
    getPublicUrl: jest.fn(),
  }

  const mockUploadService = {
    generatePresignedUrl: jest.fn(),
    generateImageUploadUrl: jest.fn(),
    getPublicUrl: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: S3IngestService,
          useValue: mockS3Service,
        },
      ],
    }).compile()

    controller = module.get<UploadController>(UploadController)
    service = module.get<UploadService>(UploadService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL for valid request', async () => {
      const body = {
        resource: 'avatars' as const,
        fileName: 'test.jpg',
        variant: 'original',
      }
      const userId = 123

      const expectedResult = {
        presignedUrl: 'https://s3.amazonaws.com/test-presigned-url',
        bucket: 'test-bucket',
        key: 'dev/app/avatars/123/original-abc123.jpg',
        publicUrl: 'https://cdn.example.com/dev/app/avatars/123/original-abc123.jpg',
        contentType: 'image/jpeg',
        expiresIn: 3600,
      }

      mockUploadService.generatePresignedUrl.mockResolvedValue(expectedResult)

      const result = await controller.generatePresignedUrl(body, userId)

      expect(result).toEqual({ ok: true, ...expectedResult })
      expect(mockUploadService.generatePresignedUrl).toHaveBeenCalledWith(body, userId)
    })

    it('should throw error for invalid file name', async () => {
      const body = {
        resource: 'avatars' as const,
        fileName: '',
        variant: 'original',
      }

      mockUploadService.generatePresignedUrl.mockRejectedValue(new Error('File name is required'))

      await expect(controller.generatePresignedUrl(body, 123)).rejects.toThrow()
    })
  })

  describe('generateImageUploadUrl', () => {
    it('should generate presigned URL for valid image', async () => {
      const body = {
        resource: 'avatars' as const,
        fileName: 'avatar.png',
      }
      const userId = 456

      const expectedResult = {
        presignedUrl: 'https://s3.amazonaws.com/test-presigned-url',
        bucket: 'test-bucket',
        key: 'dev/app/avatars/456/original-def456.png',
        publicUrl: 'https://cdn.example.com/dev/app/avatars/456/original-def456.png',
        contentType: 'image/png',
        expiresIn: 3600,
      }

      mockUploadService.generateImageUploadUrl.mockResolvedValue(expectedResult)

      const result = await controller.generateImageUploadUrl(body, userId)

      expect(result).toEqual({ ok: true, ...expectedResult })
      expect(mockUploadService.generateImageUploadUrl).toHaveBeenCalledWith(body, userId)
    })

    it('should reject non-image files', async () => {
      const body = {
        resource: 'avatars' as const,
        fileName: 'document.pdf',
      }

      mockUploadService.generateImageUploadUrl.mockRejectedValue(new Error('Invalid image file extension'))

      await expect(controller.generateImageUploadUrl(body, 123)).rejects.toThrow('Invalid image file extension')
    })

    it('should reject files without extension', async () => {
      const body = {
        resource: 'avatars' as const,
        fileName: 'noextension',
      }

      mockUploadService.generateImageUploadUrl.mockRejectedValue(new Error('Invalid image file extension'))

      await expect(controller.generateImageUploadUrl(body, 123)).rejects.toThrow()
    })
  })
})

describe('UploadService', () => {
  let service: UploadService
  let s3Service: S3IngestService

  const mockS3Service = {
    generatePresignedUrl: jest.fn(),
    getPublicUrl: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: S3IngestService,
          useValue: mockS3Service,
        },
      ],
    }).compile()

    service = module.get<UploadService>(UploadService)
    s3Service = module.get<S3IngestService>(S3IngestService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generatePresignedUrl', () => {
    it('should call S3 service with correct parameters', async () => {
      const body = {
        resource: 'uploads' as const,
        fileName: 'test.jpg',
        variant: 'original',
      }
      const userId = 123

      const expectedS3Result = {
        presignedUrl: 'https://s3.amazonaws.com/presigned',
        bucket: 'test-bucket',
        key: 'dev/app/uploads/123/original-abc.jpg',
        publicUrl: 'https://cdn.com/key',
        contentType: 'image/jpeg',
        expiresIn: 3600,
      }

      mockS3Service.generatePresignedUrl.mockResolvedValue(expectedS3Result)

      const result = await service.generatePresignedUrl(body, userId)

      expect(result).toEqual(expectedS3Result)
      expect(mockS3Service.generatePresignedUrl).toHaveBeenCalledWith({
        keyParams: expect.objectContaining({
          resource: 'uploads',
          entityId: '123',
          fileName: 'test.jpg',
          variant: 'original',
        }),
        contentType: undefined,
        expiresIn: 3600,
      })
    })

    it('should throw error for file without extension', async () => {
      const body = {
        resource: 'uploads' as const,
        fileName: 'noext',
        variant: 'original',
      }

      await expect(service.generatePresignedUrl(body, 123)).rejects.toThrow('Invalid file name - no extension found')
    })
  })

  describe('generateImageUploadUrl', () => {
    it('should accept valid image extensions', async () => {
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

      for (const ext of validExtensions) {
        mockS3Service.generatePresignedUrl.mockResolvedValue({
          presignedUrl: 'https://s3.amazonaws.com/presigned',
          bucket: 'test-bucket',
          key: `dev/app/avatars/123/original-abc.${ext}`,
          publicUrl: `https://cdn.com/key.${ext}`,
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          expiresIn: 3600,
        })

        const body = {
          resource: 'avatars' as const,
          fileName: `test.${ext}`,
        }

        await expect(service.generateImageUploadUrl(body, 123)).resolves.toBeDefined()
      }
    })

    it('should reject invalid image extensions', async () => {
      const invalidFiles = ['test.pdf', 'test.doc', 'test.exe', 'test.zip']

      for (const fileName of invalidFiles) {
        const body = {
          resource: 'avatars' as const,
          fileName,
        }

        await expect(service.generateImageUploadUrl(body, 123)).rejects.toThrow('Invalid image file extension')
      }
    })
  })

  describe('getPublicUrl', () => {
    it('should return public URL from S3 service', () => {
      const key = 'dev/app/avatars/123/original-abc.jpg'
      const expectedUrl = 'https://cdn.com/dev/app/avatars/123/original-abc.jpg'

      mockS3Service.getPublicUrl.mockReturnValue(expectedUrl)

      const result = service.getPublicUrl(key)

      expect(result).toBe(expectedUrl)
      expect(mockS3Service.getPublicUrl).toHaveBeenCalledWith(key)
    })
  })
})
