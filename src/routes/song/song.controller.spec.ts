
import { Test, TestingModule } from '@nestjs/testing';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import {
  CreateSongDto,
  GetSongsQueryDto,
  SongDto,
} from './song.dto';
import { allure } from '../../../test/allure-helper';

describe('SongController', () => {
  let controller: SongController;
  let songService: SongService;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongController],
      providers: [
        {
          provide: SongService,
          useValue: mockSongService,
        },
      ],
    }).compile();

    controller = module.get<SongController>(SongController);
    songService = module.get<SongService>(SongService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateSong', () => {
    beforeAll(() => {
      allure.story('Create new song with metadata');
    });

    it('Tạo bài hát mới với thông tin tiêu đề, mô tả, thể loại và album (nếu có)', async () => {
      allure.severity('blocker');
      allure.description('Kiểm tra chức năng tạo bài hát mới với đầy đủ thông tin');
      allure.tag('song', 'create', 'happy-path');

      const userId = 1;
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
      };

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
      };

      await allure.step('Chuẩn bị dữ liệu và mock service', async () => {
        allure.parameter('User ID', userId);
        allure.parameter('Song Title', createSongDto.title);
        allure.parameter('Duration', createSongDto.duration + 's');
        allure.attachJSON('Create Song DTO', createSongDto);
        mockSongService.createSong.mockResolvedValue(expectedResult);
      });

      let result: any;
      await allure.step('Tạo bài hát mới', async () => {
        result = await controller.createSong(createSongDto, userId);
        allure.attachJSON('Created Song', result);
      });

      await allure.step('Verify kết quả', async () => {
        expect(songService.createSong).toHaveBeenCalledWith(createSongDto, userId);
        expect(songService.createSong).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedResult);
        expect(result.title).toBe('Bài hát mới');
        expect(result.genreId).toBe(1);
        expect(result.albumId).toBe(1);
        allure.attachText('Validation', '✓ Song created\n✓ Title matches\n✓ Genre and Album set');
      });
    });
  });

  describe('GetSong', () => {
    it('Lấy thông tin chi tiết một bài hát theo ID', async () => {
      const songId = 1;
      const userId = 1;

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
      };

      mockSongService.getSongById.mockResolvedValue(expectedResult);

      const result = await controller.getSongById(songId, userId);

      expect(songService.getSongById).toHaveBeenCalledWith(songId, userId);
      expect(songService.getSongById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
      expect(result.id).toBe(songId);
      expect(result.title).toBe('Bài hát test');
    });

    it('Nên lấy thông tin bài hát khi chưa đăng nhập', async () => {
      const songId = 1;

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
      };

      mockSongService.getSongById.mockResolvedValue(expectedResult);

      const result = await controller.getSongById(songId, undefined);

      expect(songService.getSongById).toHaveBeenCalledWith(songId, undefined);
    });
  });

  describe('GetListSong', () => {
    it('Nên throw exception khi limit nhỏ hơn 1', async () => {
      const query: GetSongsQueryDto = {
        page: 1,
        limit: 0,
        order: 'latest',
      };

      mockSongService.getSongs.mockRejectedValue(
        new Error('Limit must be greater than 0')
      );

      await expect(controller.getSongs(query)).rejects.toThrow(
        'Limit must be greater than 0'
      );
    });
  });
});
