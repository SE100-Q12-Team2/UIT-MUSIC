import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  CreateListeningHistoryType,
  GetListeningHistoryQueryType,
  GetUserStatsQueryType,
  PaginatedListeningHistoryResponseType,
  RecentlyPlayedResponseType,
  UserListeningStatsType,
} from './listening-history.model'
import { PrismaService } from 'src/shared/services'

@Injectable()
export class ListeningHistoryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createHistory(userId: number, data: CreateListeningHistoryType): Promise<{ id: number; playedAt: Date }> {
    return await this.prismaService.listeningHistory.create({
      data: {
        userId,
        songId: data.songId,
        durationListened: data.durationListened || null,
        audioQuality: data.audioQuality || null,
        deviceInfo: data.deviceInfo || null,
      },
      select: {
        id: true,
        playedAt: true,
      },
    })
  }

  async getUserHistory(
    userId: number,
    query: GetListeningHistoryQueryType,
  ): Promise<PaginatedListeningHistoryResponseType> {

    const skip = (query.page - 1) * query.limit;
    const where: Prisma.ListeningHistoryWhereInput = { userId };
    if (query.startDate || query.endDate) {
      where.playedAt = {};
      if (query.startDate) where.playedAt.gte = new Date(query.startDate);
      if (query.endDate) where.playedAt.lte = new Date(query.endDate);
    }
    if (query.songId) where.songId = query.songId;

    const [totalItems, rawData] = await Promise.all([
      this.prismaService.listeningHistory.count({ where }),
      this.prismaService.listeningHistory.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { playedAt: 'desc' },
        include: {
          song: {
            include: {
              genre: true,
              album: {
                select: {
                  id: true,
                  albumTitle: true,
                  coverImage: true,
                },
              },
              contributors: {
                include: {
                  label: {
                    select: {
                      id: true,
                      labelName: true,
                    },
                  },
                },
              },
              playlistSongs: {
                include: {
                  playlist: true,
                }
              }
            },
          },
        },
      }),
    ]);

    const data = rawData.map((item) => ({
      id: item.id,
      userId: item.userId,
      songId: item.songId,
      playedAt: item.playedAt.toISOString(),
      durationListened: item.durationListened,
      audioQuality: item.audioQuality,
      deviceInfo: item.deviceInfo,
      song: {
        id: item.song.id,
        albumTitle: item.song.title,
        duration: item.song.duration,
        coverImage: item.song.album?.coverImage || null,
        album: item.song.album
          ? {
              id: item.song.album.id,
              albumTitle: item.song.album.albumTitle,
              coverImage: item.song.album.coverImage,
            }
          : null,
        contributors: item.song.contributors.map((c) => ({
          labelId: c.label.id,
          labelName: c.label.labelName,
          role: c.role,
        })),
        artists: item.song.contributors.map((c) => ({
          id: c.label.id,
          name: c.label.labelName,
          role: c.role,
        })),
      },
    }));

    return {
      data,
      totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalItems / query.limit),
    };
  }

  async getRecentlyPlayed(userId: number, limit: number = 20): Promise<RecentlyPlayedResponseType> {
    const recentSongs = await this.prismaService.listeningHistory.groupBy({
      by: ['songId'],
      where: { userId },
      _max: { playedAt: true },
      _count: { songId: true },
      orderBy: { _max: { playedAt: 'desc' } },
      take: limit,
    });

    const songIds = recentSongs.map((item) => item.songId);

    const songs = await this.prismaService.song.findMany({
      where: { id: { in: songIds } },
      include: {
        album: { select: { coverImage: true } },
        playlistSongs: {
          include: { playlist: {
            select: {
              coverImageUrl: true,
              id: true,
              playlistName: true,
            }
          } },
        },
        contributors: {
          include: {
            label: {
              select: {
                id: true,
                labelName: true,
              },
            },
          },
        },
      },
    });

    const data = recentSongs.map((recent) => {
      const song = songs.find((s) => s.id === recent.songId);
      return {
        songId: recent.songId,
        title: song?.title || '',
        coverImageUrl: song?.album?.coverImage || null,
        playlist: song
          ? song.playlistSongs.map((ps) => ({
              id: ps.playlist.id,
              playlistName: ps.playlist.playlistName,
              coverImageUrl: ps.playlist.coverImageUrl,
            }))
          : [],
        duration: song?.duration || 0,
        lastPlayedAt: recent._max.playedAt!,
        playCount: recent._count.songId,
        artists:
          song?.contributors.map((c) => ({
            id: c.label.id,
            name: c.label.labelName,
          })) || [],
      };
    });

    return {
      data: data.map((item) => ({
        ...item,
        lastPlayedAt: item.lastPlayedAt.toISOString(),
      })),
      totalItems: data.length,
    };
  }

  async getUserStats(userId: number, query: GetUserStatsQueryType): Promise<UserListeningStatsType> {
    const where: Prisma.ListeningHistoryWhereInput = { userId };
    if (query.startDate || query.endDate) {
      where.playedAt = {};
      if (query.startDate) where.playedAt.gte = new Date(query.startDate);
      if (query.endDate) where.playedAt.lte = new Date(query.endDate);
    }

    const [totalStats, history] = await Promise.all([
      this.prismaService.listeningHistory.aggregate({
        where,
        _sum: { durationListened: true },
        _count: { id: true },
      }),
      this.prismaService.listeningHistory.findMany({
        where,
        include: {
          song: {
            include: {
              genre: { select: { genreName: true } },
              contributors: {
                include: {
                  label: { select: { id: true, labelName: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalListeningTime = totalStats._sum.durationListened || 0;
    const totalSongsPlayed = totalStats._count.id || 0;
    const averageListeningTime = totalSongsPlayed > 0 ? totalListeningTime / totalSongsPlayed : 0;

    const genreCount: Record<string, number> = {};
    const labelCount: Record<number, { name: string; count: number }> = {};
    history.forEach((h) => {
      if (h.song && h.song.genre) {
        genreCount[h.song.genre.genreName] = (genreCount[h.song.genre.genreName] || 0) + 1;
      }
      if (h.song && h.song.contributors) {
        h.song.contributors.forEach((c) => {
          if (!labelCount[c.label.id]) {
            labelCount[c.label.id] = { name: c.label.labelName, count: 0 };
          }
          labelCount[c.label.id].count++;
        });
      }
    });
    const topGenres = Object.entries(genreCount)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: (count / totalSongsPlayed) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topLabels = Object.entries(labelCount)
      .map(([id, data]) => ({
        labelId: Number(id),
        labelName: data.name,
        playCount: data.count,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);

    const songCount: Record<number, { title: string; count: number; duration: number }> = {};
    history.forEach((h) => {
      if (h.song) {
        if (!songCount[h.song.id]) {
          songCount[h.song.id] = {
            title: h.song.title,
            count: 0,
            duration: 0,
          };
        }
        songCount[h.song.id].count++;
        songCount[h.song.id].duration += h.durationListened || 0;
      }
    });
    // Get top 10 song IDs
    const topSongArr = Object.entries(songCount)
      .map(([id, data]) => ({
        songId: Number(id),
        songTitle: data.title,
        playCount: data.count,
        totalDuration: data.duration,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);

    // Fetch coverImageUrl for top songs
    let coverImageMap: Record<number, string | null> = {};
    if (topSongArr.length > 0) {
      const topSongIds = topSongArr.map(s => s.songId);
      const topSongAlbums = await this.prismaService.song.findMany({
        where: { id: { in: topSongIds } },
        select: { id: true, album: { select: { coverImage: true } } },
      });
      coverImageMap = topSongAlbums.reduce((acc, s) => {
        acc[s.id] = s.album?.coverImage || null;
        return acc;
      }, {} as Record<number, string | null>);
    }

    const topSongs = topSongArr.map(song => ({
      ...song,
      coverImageUrl: coverImageMap[song.songId] || null,
    }));

    const hourCount: Record<number, number> = {};
    history.forEach((h) => {
      const hour = new Date(h.playedAt).getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    const listeningByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCount[hour] || 0,
    }));

    const dayCount: Record<string, { count: number; duration: number }> = {};
    history.forEach((h) => {
      const date = new Date(h.playedAt).toISOString().split('T')[0];
      if (!dayCount[date]) {
        dayCount[date] = { count: 0, duration: 0 };
      }
      dayCount[date].count++;
      dayCount[date].duration += h.durationListened || 0;
    });
    const listeningByDay = Object.entries(dayCount)
      .map(([date, data]) => ({
        date,
        count: data.count,
        totalDuration: data.duration,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalListeningTime,
      totalSongsPlayed,
      averageListeningTime: Math.round(averageListeningTime),
      topGenres,
      topArtists: topLabels.map(l => ({
        artistId: l.labelId,
        artistName: l.labelName,
        playCount: l.playCount,
      })),
      topSongs,
      listeningByHour,
      listeningByDay,
    };
  }

  async deleteHistory(userId: number, historyId: number): Promise<{ message: string }> {
    await this.prismaService.listeningHistory.delete({
      where: {
        id: historyId,
        userId,
      },
    })

    return {
      message: 'Listening history item deleted successfully',
    }
  }

  async clearHistory(userId: number): Promise<number> {
    const result = await this.prismaService.listeningHistory.deleteMany({
      where: { userId },
    })
    return result.count
  }
}
