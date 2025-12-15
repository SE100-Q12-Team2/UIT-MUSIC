
import { Test, TestingModule } from '@nestjs/testing';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import {
  GetSongsQueryDto,
  SongDto,
} from './song.dto';
import { allure } from '../../../test/allure-helper';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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

  describe('GetSongById', () => {
    beforeAll(() => {
      allure.feature('Song Details');
      allure.story('Get Song By ID Decision Table (UTCID 01-05)');
    });

    const userId = 1;

    // --- UTCID01: Happy Path ---
    it('[UTCID01] Lấy bài hát thành công với ID hợp lệ = 1 (200 OK)', async () => {
      allure.severity('blocker');
      allure.description('Case: Valid ID (1) -> Expect: 200 OK + Song Data');
      
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
        songArtists: [],
        isFavorite: false,
      };

      mockSongService.getSongById.mockResolvedValue(expectedResult);

      const result = await controller.getSongById(songId, userId);

      expect(songService.getSongById).toHaveBeenCalledWith(songId, userId);
      expect(result).toEqual(expectedResult);
    });

    // --- UTCID02: Song Not Found ---
    it('[UTCID02] Lấy bài hát thất bại với ID không tồn tại = 14 (404 Not Found)', async () => {
      allure.severity('critical');
      allure.description('Case: ID exists in format but not in DB (14) -> Expect: 404 Not Found');

      const songId = 14;

      mockSongService.getSongById.mockRejectedValue(
        new NotFoundException(`Song with ID ${songId} not found`)
      );

      await expect(controller.getSongById(songId, userId)).rejects.toThrow(NotFoundException);
      await expect(controller.getSongById(songId, userId)).rejects.toThrow(`Song with ID ${songId} not found`);
    });

    // --- UTCID03: Invalid ID (Zero) ---
    it('[UTCID03] Lấy bài hát thất bại với ID = 0 (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Case: ID = 0 -> Expect: 400 Bad Request (theo bảng Decision Table)');

      const songId = 0;

      mockSongService.getSongById.mockRejectedValue(
        new BadRequestException('Invalid song ID')
      );

      await expect(controller.getSongById(songId, userId)).rejects.toThrow(BadRequestException);
    });

    // --- UTCID04: Invalid ID (Negative) ---
    it('[UTCID04] Lấy bài hát thất bại với ID âm = -123 (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Case: ID = -123 -> Expect: 400 Bad Request');

      const songId = -123;

      mockSongService.getSongById.mockRejectedValue(
        new BadRequestException('Song ID cannot be negative')
      );

      await expect(controller.getSongById(songId, userId)).rejects.toThrow(BadRequestException);
    });

    it('[UTCID05] Lấy bài hát thất bại với ID không phải số = "abc" (400 Bad Request)', async () => {
      allure.severity('minor');
      allure.description('Case: ID = "abc" -> Expect: 400 Bad Request (ValidateException)');

      const songId = 'abc' as any;

      mockSongService.getSongById.mockRejectedValue(
        new BadRequestException('Validation failed (numeric string is expected)')
      );

      await expect(controller.getSongById(songId, userId)).rejects.toThrow(BadRequestException);
      await expect(controller.getSongById(songId, userId)).rejects.toThrow('Validation failed');
    });
  });

  describe('GetListSong', () => {
    beforeAll(() => {
      allure.feature('Music Exploration');
      allure.story('Get Songs List Decision Table (UTCID 01-11)');
    });

    // --- UTCID02: Invalid Input (Empty/NaN) ---
    it('[UTCID02] Lấy danh sách thất bại do tham số rỗng hoặc không hợp lệ (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Input: Empty strings/nulls for numeric fields -> Expect: 400 Bad Request');

      const query = {
        page: '' as any,
        limit: null as any,
        genreId: '' as any,
        order: '' as any,
      };

      mockSongService.getSongs.mockRejectedValue(
        new BadRequestException('Invalid input: expected number, received NaN')
      );

      await expect(controller.getSongs(query)).rejects.toThrow(BadRequestException);
      await expect(controller.getSongs(query)).rejects.toThrow('Invalid input');
    });

    // --- UTCID03: Invalid Page (Zero) ---
    it('[UTCID03] Lấy danh sách thất bại do Page = 0 (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Input: Page=0 -> Expect: 400 Bad Request (Too small)');

      const query: GetSongsQueryDto = {
        page: 0,
        limit: 2,
        genreId: 1,
        order: 'latest',
      };

      mockSongService.getSongs.mockRejectedValue(
        new BadRequestException('Page must be greater than 0')
      );

      await expect(controller.getSongs(query)).rejects.toThrow(BadRequestException);
    });

    // --- UTCID04: Invalid Page (Negative) ---
    it('[UTCID04] Lấy danh sách thất bại do Page âm (-123) (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Input: Page=-123 -> Expect: 400 Bad Request');

      const query: GetSongsQueryDto = {
        page: -123,
        limit: 2,
        genreId: 1,
        order: 'latest',
      };

      mockSongService.getSongs.mockRejectedValue(
        new BadRequestException('Page must be greater than 0')
      );

      await expect(controller.getSongs(query)).rejects.toThrow(BadRequestException);
    });

    // --- UTCID05: Invalid Limit (Zero) ---
    it('[UTCID06] Lấy danh sách thất bại do Limit = 0 (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Input: Limit=0 -> Expect: 400 Bad Request');

      const query: GetSongsQueryDto = {
        page: 1,
        limit: 0,
        genreId: 1,
        order: 'latest',
      };

      mockSongService.getSongs.mockRejectedValue(
        new BadRequestException('Limit must be greater than 0')
      );

      await expect(controller.getSongs(query)).rejects.toThrow(BadRequestException);
    });

    // --- UTCID06: Invalid Limit (String "abc") ---
    it('[UTCID08] Lấy danh sách thất bại do Limit không phải số ("abc") (400 Bad Request)', async () => {
      allure.severity('minor');
      allure.description('Input: Limit="abc" -> Expect: 400 Bad Request (NaN)');

      const query = {
        page: 1,
        limit: 'abc' as any,
        genreId: 1,
        order: 'latest',
      };

      mockSongService.getSongs.mockRejectedValue(
        new BadRequestException('Invalid input: expected number, received NaN')
      );

      await expect(controller.getSongs(query as any)).rejects.toThrow(BadRequestException);
    });

    // --- UTCID07: Genre Not Found ---
    it('[UTCID09] Lấy danh sách thất bại do GenreId không tồn tại (15) (404 Not Found)', async () => {
      allure.severity('critical');
      allure.description('Input: GenreId=15 (non-existent) -> Expect: 404 Not Found');

      const query: GetSongsQueryDto = {
        page: 1,
        limit: 2,
        genreId: 15,
        order: 'latest',
      };

      mockSongService.getSongs.mockRejectedValue(
        new NotFoundException('Genre not found')
      );

      await expect(controller.getSongs(query)).rejects.toThrow(NotFoundException);
      await expect(controller.getSongs(query)).rejects.toThrow('Genre not found');
    });

    // --- UTCID8: Invalid GenreId (String "abac") ---
    it('[UTCID10] Lấy danh sách thất bại do GenreId không phải số ("abac") (400 Bad Request)', async () => {
      allure.severity('minor');
      allure.description('Input: GenreId="abac" -> Expect: 400 Bad Request (NaN)');

      const query = {
        page: 1,
        limit: 2,
        genreId: 'abac' as any,
        order: 'latest',
      };

      mockSongService.getSongs.mockRejectedValue(
        new BadRequestException('Invalid input: expected number, received NaN')
      );

      await expect(controller.getSongs(query as any)).rejects.toThrow(BadRequestException);
    });

    // --- UTCID9: Invalid Order Enum ---
    it('[UTCID11] Lấy danh sách thất bại do Order sai Enum ("not exist enum") (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Input: Order="not exist enum" -> Expect: 400 Bad Request');

      const query = {
        page: 1,
        limit: 2,
        genreId: 1,
        order: 'not exist enum' as any,
      };

      mockSongService.getSongs.mockRejectedValue(
        new BadRequestException('Invalid option: expected one of "latest", "popular", "title"')
      );

      await expect(controller.getSongs(query as any)).rejects.toThrow(BadRequestException);
    });
  });
});
