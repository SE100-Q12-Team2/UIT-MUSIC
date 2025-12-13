import { Test, TestingModule } from '@nestjs/testing'
import { SongController } from './song.controller'
import { SongService } from './song.service'
import { CreateSongDto, GetSongsQueryDto, SongDto, PaginatedSongsDto } from './song.dto'
import { NotFoundException } from '@nestjs/common'
import { allure } from '../../../test/allure-helper'

describe('SongController', () => {
  let controller: SongController
  let songService: SongService

  beforeAll(() => {
    allure.epic('Music Management');
    allure.feature('Song Management');
    allure.owner('Music Team');
  });

  const mockSongService = {
    createSong: jest.fn(),
    getSongById: jest.fn(),
    getSongs: jest.fn(),
    updateSong: jest.fn(),
    deleteSong: jest.fn(),
    incrementPlayCount: jest.fn(),
    getTrendingSongs: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongController],
      providers: [
        {
          provide: SongService,
          useValue: mockSongService,
        },
      ],
    }).compile()

    controller = module.get<SongController>(SongController)
    songService = module.get<SongService>(SongService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('CreateSong', () => {
    beforeAll(() => {
      allure.story('Create new song with metadata');
    });

    it('Tạo bài hát mới với thông tin tiêu đề, mô tả, thể loại và album (nếu có)', async () => {
      allure.severity('blocker');
      allure.description('Kiểm tra chức năng tạo bài hát mới với đầy đủ thông tin');
      allure.tag('song', 'create', 'happy-path');

      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Bài hát mới',
        description: 'Mô tả bài hát',
        duration: 240,
        genreId: 1,
        albumId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      const expectedResult = {
        id: 1,
        title: 'Bài hát mới',
        description: 'Mô tả bài hát',
        duration: 240,
        genreId: 1,
        albumId: 1,
        language: 'vi',
        uploadDate: '2024-01-01T00:00:00.000Z',
        playCount: 0,
        isActive: true,
        songArtists: [
          {
            artistId: 1,
            songId: 1,
            role: 'MainArtist',
            artist: {
              id: 1,
              artistName: 'Nghệ sĩ A',
              profileImage: null,
            },
          },
        ],
      }

      await allure.step('Chuẩn bị dữ liệu và mock service', async () => {
        allure.parameter('User ID', userId);
        allure.parameter('Song Title', createSongDto.title);
        allure.parameter('Duration', createSongDto.duration + 's');
        allure.attachJSON('Create Song DTO', createSongDto);
        mockSongService.createSong.mockResolvedValue(expectedResult)
      });

      // Act
      let result: any;
      await allure.step('Tạo bài hát mới', async () => {
        result = await controller.createSong(createSongDto, userId)
        allure.attachJSON('Created Song', result);
      });

      // Assert
      await allure.step('Verify kết quả', async () => {
        expect(songService.createSong).toHaveBeenCalledWith(createSongDto, userId)
        expect(songService.createSong).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
        expect(result.title).toBe('Bài hát mới')
        expect(result.genreId).toBe(1)
        expect(result.albumId).toBe(1)
        allure.attachText('Validation', '✓ Song created\n✓ Title matches\n✓ Genre and Album set');
      });
    })

    it('Nên tạo bài hát không có album', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Single',
        description: 'Bài hát đơn',
        duration: 180,
        genreId: 2,
        language: 'en',
        artists: [
          {
            artistId: 2,
            role: 'MainArtist',
          },
        ],
      }

      const expectedResult = {
        id: 2,
        title: 'Single',
        description: 'Bài hát đơn',
        duration: 180,
        genreId: 2,
        albumId: null,
        language: 'en',
        uploadDate: '2024-02-01T00:00:00.000Z',
        playCount: 0,
        isActive: true,
        songArtists: [
          {
            artistId: 2,
            songId: 2,
            role: 'MainArtist',
            artist: {
              id: 2,
              artistName: 'Nghệ sĩ B',
              profileImage: null,
            },
          },
        ],
      }

      mockSongService.createSong.mockResolvedValue(expectedResult)

      // Act
      const result: any = await controller.createSong(createSongDto, userId)

      // Assert
      expect(result.albumId).toBeNull()
      expect(result.title).toBe('Single')
    })

    it('Nên tạo bài hát với nhiều nghệ sĩ', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Collaboration Song',
        description: 'Bài hát kết hợp',
        duration: 200,
        genreId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
          {
            artistId: 2,
            role: 'FeaturedArtist',
          },
        ],
      }

      const expectedResult = {
        id: 3,
        title: 'Collaboration Song',
        description: 'Bài hát kết hợp',
        duration: 200,
        genreId: 1,
        albumId: null,
        language: 'vi',
        uploadDate: '2024-03-01T00:00:00.000Z',
        playCount: 0,
        isActive: true,
        songArtists: [
          {
            artistId: 1,
            songId: 3,
            role: 'MainArtist',
            artist: {
              id: 1,
              artistName: 'Nghệ sĩ A',
              profileImage: null,
            },
          },
          {
            artistId: 2,
            songId: 3,
            role: 'FeaturedArtist',
            artist: {
              id: 2,
              artistName: 'Nghệ sĩ B',
              profileImage: null,
            },
          },
        ],
      }

      mockSongService.createSong.mockResolvedValue(expectedResult)

      // Act
      const result: any = await controller.createSong(createSongDto, userId)

      // Assert
      expect(result.songArtists).toHaveLength(2)
      expect(result.songArtists[0].role).toBe('MainArtist')
      expect(result.songArtists[1].role).toBe('FeaturedArtist')
    })

    it('Nên throw exception khi genreId không hợp lệ', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Test Song',
        description: 'Test',
        duration: 180,
        genreId: 999,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      mockSongService.createSong.mockRejectedValue(
        new NotFoundException('Genre not found')
      )

      // Act & Assert
      await expect(controller.createSong(createSongDto, userId)).rejects.toThrow(
        'Genre not found'
      )
    })

    it('Nên throw exception khi artistId không hợp lệ', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Test Song',
        description: 'Test',
        duration: 180,
        genreId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 999,
            role: 'MainArtist',
          },
        ],
      }

      mockSongService.createSong.mockRejectedValue(
        new NotFoundException('Artist not found')
      )

      // Act & Assert
      await expect(controller.createSong(createSongDto, userId)).rejects.toThrow(
        'Artist not found'
      )
    })

    it('Nên throw exception khi albumId không hợp lệ', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Test Song',
        description: 'Test',
        duration: 180,
        genreId: 1,
        albumId: 999,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      mockSongService.createSong.mockRejectedValue(
        new NotFoundException('Album not found')
      )

      // Act & Assert
      await expect(controller.createSong(createSongDto, userId)).rejects.toThrow(
        'Album not found'
      )
    })

    it('Nên throw exception khi title trống', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: '',
        description: 'Test',
        duration: 180,
        genreId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      mockSongService.createSong.mockRejectedValue(
        new Error('Title is required')
      )

      // Act & Assert
      await expect(controller.createSong(createSongDto, userId)).rejects.toThrow(
        'Title is required'
      )
    })

    it('Nên throw exception khi duration không hợp lệ (số âm)', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Test Song',
        description: 'Test',
        duration: -10,
        genreId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      mockSongService.createSong.mockRejectedValue(
        new Error('Duration must be greater than 0')
      )

      // Act & Assert
      await expect(controller.createSong(createSongDto, userId)).rejects.toThrow(
        'Duration must be greater than 0'
      )
    })

    it('Nên throw exception khi không có artists', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Test Song',
        description: 'Test',
        duration: 180,
        genreId: 1,
        language: 'vi',
        artists: [],
      }

      mockSongService.createSong.mockRejectedValue(
        new Error('At least one artist is required')
      )

      // Act & Assert
      await expect(controller.createSong(createSongDto, userId)).rejects.toThrow(
        'At least one artist is required'
      )
    })

    it('Nên throw exception khi releaseDate không hợp lệ', async () => {
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Test Song',
        description: 'Test',
        duration: 180,
        genreId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      mockSongService.createSong.mockRejectedValue(
        new Error('Invalid release date format')
      )

      // Act & Assert
      await expect(controller.createSong(createSongDto, userId)).rejects.toThrow(
        'Invalid release date format'
      )
    })

    it('[DEMO FAIL] Nên có ít nhất 3 nghệ sĩ trong bài hát', async () => {
      allure.severity('normal');
      allure.tag('demo-failure', 'validation');
      
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Test Song',
        description: 'Test',
        duration: 180,
        genreId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      const expectedResult: any = {
        id: 1,
        title: 'Test Song',
        songArtists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      mockSongService.createSong.mockResolvedValue(expectedResult)

      // Act
      const result: any = await controller.createSong(createSongDto, userId)

      // Assert - Demo fail: Kiểm tra số lượng nghệ sĩ phải >= 3
      expect(result.songArtists.length).toBeGreaterThanOrEqual(3) // Sẽ fail vì chỉ có 1 nghệ sĩ
    })

    it('[DEMO FAIL] Tiêu đề bài hát phải dài hơn 50 ký tự', async () => {
      allure.severity('trivial');
      allure.tag('demo-failure', 'validation');
      
      // Arrange
      const userId = 1
      const createSongDto: CreateSongDto = {
        title: 'Bài hát ngắn',
        description: 'Test',
        duration: 180,
        genreId: 1,
        language: 'vi',
        artists: [
          {
            artistId: 1,
            role: 'MainArtist',
          },
        ],
      }

      const expectedResult: any = {
        id: 1,
        title: 'Bài hát ngắn',
      }

      mockSongService.createSong.mockResolvedValue(expectedResult)

      // Act
      const result: any = await controller.createSong(createSongDto, userId)

      // Assert - Demo fail: Kiểm tra độ dài title
      expect(result.title.length).toBeGreaterThan(50) // Sẽ fail
    })
  })

  describe('GetSong', () => {
    it('Lấy thông tin chi tiết một bài hát theo ID', async () => {
      // Arrange
      const songId = 1
      const userId = 1

      const expectedResult: SongDto = {
        id: 1,
        title: 'Bài hát test',
        description: 'Mô tả',
        duration: 240,
        genreId: 1,
        albumId: 1,
        labelId: 1,
        language: 'vi',
        uploadDate: '2024-01-01T00:00:00.000Z',
        playCount: 100,
        isActive: true,
        copyrightStatus: 'Clear',
        lyrics: null,
        genre: {
          id: 1,
          genreName: 'Pop',
        },
        album: {
          id: 1,
          albumTitle: 'Album Test',
          coverImage: 'https://example.com/album-cover.jpg',
        },
        songArtists: [
          {
            artistId: 1,
            songId: 1,
            role: 'MainArtist',
            artist: {
              id: 1,
              artistName: 'Nghệ sĩ A',
              profileImage: null,
            },
          },
        ],
        isFavorite: false,
      }

      mockSongService.getSongById.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongById(songId, userId)

      // Assert
      expect(songService.getSongById).toHaveBeenCalledWith(songId, userId)
      expect(songService.getSongById).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResult)
      expect(result.id).toBe(songId)
      expect(result.title).toBe('Bài hát test')
    })

    it('Nên lấy thông tin bài hát khi chưa đăng nhập', async () => {
      // Arrange
      const songId = 1

      const expectedResult: SongDto = {
        id: 1,
        title: 'Bài hát test',
        description: 'Mô tả',
        duration: 240,
        genreId: 1,
        albumId: 1,
        labelId: 1,
        language: 'vi',
        uploadDate: '2024-01-01T00:00:00.000Z',
        playCount: 100,
        isActive: true,
        copyrightStatus: 'Clear',
        lyrics: null,
        genre: {
          id: 1,
          genreName: 'Pop',
        },
        album: {
          id: 1,
          albumTitle: 'Album Test',
          coverImage: 'https://example.com/album-cover.jpg',
        },
        songArtists: [
          {
            artistId: 1,
            songId: 1,
            role: 'MainArtist',
            artist: {
              id: 1,
              artistName: 'Nghệ sĩ A',
              profileImage: null,
            },
          },
        ],
        isFavorite: false,
      }

      mockSongService.getSongById.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongById(songId, undefined)

      // Assert
      expect(songService.getSongById).toHaveBeenCalledWith(songId, undefined)
    })

    it('Nên throw exception khi bài hát không tồn tại', async () => {
      // Arrange
      const songId = 999

      mockSongService.getSongById.mockRejectedValue(
        new NotFoundException(`Song with ID ${songId} not found`)
      )

      // Act & Assert
      await expect(controller.getSongById(songId)).rejects.toThrow(
        `Song with ID ${songId} not found`
      )
    })

    it('Nên hiển thị trạng thái favorite khi user đã đăng nhập', async () => {
      // Arrange
      const songId = 1
      const userId = 1

      const expectedResult: SongDto = {
        id: 1,
        title: 'Bài hát test',
        description: 'Mô tả',
        duration: 240,
        genreId: 1,
        albumId: 1,
        labelId: 1,
        language: 'vi',
        uploadDate: '2024-01-01T00:00:00.000Z',
        playCount: 100,
        isActive: true,
        copyrightStatus: 'Clear',
        lyrics: null,
        genre: {
          id: 1,
          genreName: 'Pop',
        },
        album: {
          id: 1,
          albumTitle: 'Album Test',
          coverImage: 'https://example.com/album-cover.jpg',
        },
        songArtists: [
          {
            artistId: 1,
            songId: 1,
            role: 'MainArtist',
            artist: {
              id: 1,
              artistName: 'Nghệ sĩ A',
              profileImage: null,
            },
          },
        ],
        isFavorite: true,
      }

      mockSongService.getSongById.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongById(songId, userId)

      // Assert
      expect(result.id).toBe(songId)
    })

    it('Nên throw exception khi songId không hợp lệ (số âm)', async () => {
      // Arrange
      const songId = -1

      mockSongService.getSongById.mockRejectedValue(
        new Error('Invalid song ID')
      )

      // Act & Assert
      await expect(controller.getSongById(songId)).rejects.toThrow(
        'Invalid song ID'
      )
    })

    it('Nên throw exception khi bài hát đã bị xóa (isActive = false)', async () => {
      // Arrange
      const songId = 1

      mockSongService.getSongById.mockRejectedValue(
        new NotFoundException('Song is not active or has been deleted')
      )

      // Act & Assert
      await expect(controller.getSongById(songId)).rejects.toThrow(
        'Song is not active or has been deleted'
      )
    })

    it('[DEMO FAIL] PlayCount phải lớn hơn 10000', async () => {
      allure.severity('normal');
      allure.tag('demo-failure', 'business-logic');
      
      // Arrange
      const songId = 1
      const userId = 1

      const expectedResult: SongDto = {
        id: 1,
        title: 'Bài hát test',
        description: 'Mô tả',
        duration: 240,
        genreId: 1,
        albumId: 1,
        labelId: 1,
        language: 'vi',
        uploadDate: '2024-01-01T00:00:00.000Z',
        playCount: 100,
        isActive: true,
        copyrightStatus: 'Clear',
        lyrics: null,
        genre: {
          id: 1,
          genreName: 'Pop',
        },
        album: {
          id: 1,
          albumTitle: 'Album Test',
          coverImage: null,
        },
        songArtists: [],
      }

      mockSongService.getSongById.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongById(songId, userId)

      // Assert - Demo fail
      expect(result.playCount).toBeGreaterThan(10000) // Sẽ fail vì chỉ có 100
    })
  })

  describe('GetListSong', () => {
    it('Lấy danh sách bài hát với phân trang, tìm kiếm và bộ lọc', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        genreId: 1,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [
          {
            id: 1,
            title: 'Song 1',
            description: 'Description 1',
            duration: 200,
            genreId: 1,
            albumId: null,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-01T00:00:00.000Z',
            playCount: 100,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            songArtists: [],
            isFavorite: false,
          },
          {
            id: 2,
            title: 'Song 2',
            description: 'Description 2',
            duration: 180,
            genreId: 1,
            albumId: null,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-02T00:00:00.000Z',
            playCount: 50,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            songArtists: [],
            isFavorite: false,
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert
      expect(songService.getSongs).toHaveBeenCalledWith(query, undefined)
      expect(songService.getSongs).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResult)
      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it('Nên lọc bài hát theo genreId', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        genreId: 2,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [
          {
            id: 3,
            title: 'Rock Song',
            description: 'Rock description',
            duration: 250,
            genreId: 2,
            albumId: null,
            labelId: 1,
            language: 'en',
            uploadDate: '2024-01-01T00:00:00.000Z',
            playCount: 200,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 2,
              genreName: 'Rock',
            },
            songArtists: [],
            isFavorite: false,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert
      expect(result.items[0].genreId).toBe(2)
      expect(result.items[0].genre?.genreName).toBe('Rock')
    })

    it('Nên lọc bài hát theo artistId', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        artistId: 1,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [
          {
            id: 1,
            title: 'Artist 1 Song',
            description: 'Description',
            duration: 200,
            genreId: 1,
            albumId: null,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-01T00:00:00.000Z',
            playCount: 100,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            songArtists: [
              {
                artistId: 1,
                songId: 1,
                role: 'MainArtist',
                artist: {
                  id: 1,
                  artistName: 'Nghệ sĩ A',
                  profileImage: null,
                },
              },
            ],
            isFavorite: false,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert
      expect(result.items[0].songArtists[0].artistId).toBe(1)
    })

    it('Nên lọc bài hát theo albumId', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        albumId: 1,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [
          {
            id: 1,
            title: 'Album Song 1',
            description: 'Description',
            duration: 200,
            genreId: 1,
            albumId: 1,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-01T00:00:00.000Z',
            playCount: 100,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            album: {
              id: 1,
              albumTitle: 'Album Test',
              coverImage: null,
            },
            songArtists: [],
            isFavorite: false,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert
      expect(result.items[0].albumId).toBe(1)
    })

    it('Nên sắp xếp theo popular (playCount)', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        order: 'popular',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [
          {
            id: 2,
            title: 'Popular Song',
            description: 'Most played',
            duration: 200,
            genreId: 1,
            albumId: null,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-01T00:00:00.000Z',
            playCount: 1000,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            songArtists: [],
            isFavorite: false,
          },
          {
            id: 1,
            title: 'Less Popular',
            description: 'Less played',
            duration: 180,
            genreId: 1,
            albumId: null,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-02T00:00:00.000Z',
            playCount: 100,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            songArtists: [],
            isFavorite: false,
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert
      expect(result.items[0].playCount).toBeGreaterThan(result.items[1].playCount)
    })

    it('Nên phân trang đúng', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 2,
        limit: 10,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [],
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert
      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
      expect(result.totalPages).toBe(2)
    })

    it('Nên throw exception khi page nhỏ hơn 1', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 0,
        limit: 20,
        order: 'latest',
      }

      mockSongService.getSongs.mockRejectedValue(
        new Error('Page must be greater than or equal to 1')
      )

      // Act & Assert
      await expect(controller.getSongs(query)).rejects.toThrow(
        'Page must be greater than or equal to 1'
      )
    })

    it('Nên throw exception khi limit quá lớn', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 1000,
        order: 'latest',
      }

      mockSongService.getSongs.mockRejectedValue(
        new Error('Limit must not exceed 100')
      )

      // Act & Assert
      await expect(controller.getSongs(query)).rejects.toThrow(
        'Limit must not exceed 100'
      )
    })

    it('Nên throw exception khi genreId không tồn tại', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        genreId: 999,
        order: 'latest',
      }

      mockSongService.getSongs.mockRejectedValue(
        new NotFoundException('Genre not found')
      )

      // Act & Assert
      await expect(controller.getSongs(query)).rejects.toThrow(
        'Genre not found'
      )
    })

    it('Nên throw exception khi artistId không tồn tại', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        artistId: 999,
        order: 'latest',
      }

      mockSongService.getSongs.mockRejectedValue(
        new NotFoundException('Artist not found')
      )

      // Act & Assert
      await expect(controller.getSongs(query)).rejects.toThrow(
        'Artist not found'
      )
    })

    it('Nên throw exception khi albumId không tồn tại', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        albumId: 999,
        order: 'latest',
      }

      mockSongService.getSongs.mockRejectedValue(
        new NotFoundException('Album not found')
      )

      // Act & Assert
      await expect(controller.getSongs(query)).rejects.toThrow(
        'Album not found'
      )
    })

    it('Nên throw exception khi order không hợp lệ', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        order: 'invalid-order' as any,
      }

      mockSongService.getSongs.mockRejectedValue(
        new Error('Invalid order parameter')
      )

      // Act & Assert
      await expect(controller.getSongs(query)).rejects.toThrow(
        'Invalid order parameter'
      )
    })

    it('Nên trả về mảng rỗng khi không tìm thấy bài hát nào', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('Nên throw exception khi limit nhỏ hơn 1', async () => {
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 0,
        order: 'latest',
      }

      mockSongService.getSongs.mockRejectedValue(
        new Error('Limit must be greater than 0')
      )

      // Act & Assert
      await expect(controller.getSongs(query)).rejects.toThrow(
        'Limit must be greater than 0'
      )
    })

    it('[DEMO FAIL] Phải trả về ít nhất 100 bài hát', async () => {
      allure.severity('critical');
      allure.tag('demo-failure', 'business-requirement');
      
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [
          {
            id: 1,
            title: 'Song 1',
            description: 'Description 1',
            duration: 200,
            genreId: 1,
            albumId: null,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-01T00:00:00.000Z',
            playCount: 100,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            songArtists: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert - Demo fail
      expect(result.total).toBeGreaterThanOrEqual(100) // Sẽ fail vì chỉ có 1
    })

    it('[DEMO FAIL] Mỗi bài hát phải có album', async () => {
      allure.severity('normal');
      allure.tag('demo-failure', 'data-integrity');
      
      // Arrange
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 20,
        order: 'latest',
      }

      const expectedResult: PaginatedSongsDto = {
        items: [
          {
            id: 1,
            title: 'Song 1',
            description: 'Description 1',
            duration: 200,
            genreId: 1,
            albumId: null,
            labelId: 1,
            language: 'vi',
            uploadDate: '2024-01-01T00:00:00.000Z',
            playCount: 100,
            isActive: true,
            copyrightStatus: 'Clear',
            lyrics: null,
            genre: {
              id: 1,
              genreName: 'Pop',
            },
            songArtists: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }

      mockSongService.getSongs.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.getSongs(query)

      // Assert - Demo fail
      expect(result.items[0].albumId).not.toBeNull() // Sẽ fail vì albumId là null
    })
  })
})
