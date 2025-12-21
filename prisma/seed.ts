import 'dotenv/config'
import {
  PrismaClient,
  Gender,
  MediaStatus,
  AudioQuality,
  RenditionType,
  TransactionStatus,
  AdType,
  ReportStatus,
  NotificationType,
  ReporterType,
  CopyrightStatus,
  type Song,
  RecordLabelType,
} from '@prisma/client'
import bcrypt from 'bcrypt'
import { Decimal } from 'decimal.js'
import { faker } from '@faker-js/faker'
import { PrismaPg } from '@prisma/adapter-pg'

/* ================= INIT ================= */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

type SeedSize = 'small' | 'medium' | 'large'

const SEED_SIZE: SeedSize = (process.env.SEED_SIZE as SeedSize) || 'small'

const CONFIG = {
  small: { users: 10, labels: 3, songs: 15 },
  medium: { users: 30, labels: 10, songs: 80 },
  large: { users: 100, labels: 30, songs: 300 },
}[SEED_SIZE]

/* ================= MAIN ================= */
async function main() {
  console.log(`🌱 Seeding (${SEED_SIZE})`)

  /* ========= CLEAN DB ========= */
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "favorites","follows","Rendition","Asset","listening_history",
      "playlist_songs","playlists","SongContributor","songs","albums",
      "genres","record_labels","ad_impressions","advertisements",
      "notifications","copyright_reports","daily_statistics",
      "transactions","user_subscriptions","subscription_plans",
      "payment_methods","users","Role"
    RESTART IDENTITY CASCADE
  `)

  const password = await bcrypt.hash('password123', 10)

  // ===== ROLES =====
  const [roleListener, roleLabel, roleAdmin] = await Promise.all([
    prisma.role.create({ data: { name: 'Listener' } }),
    prisma.role.create({ data: { name: 'Label' } }),
    prisma.role.create({ data: { name: 'Admin' } }),
  ])

  // ===== USERS =====
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@uitmusic.com',
      password,
      fullName: 'UIT Admin',
      gender: Gender.Other,
      roleId: roleAdmin.id,
    },
  })

  // Listeners
  const users = await Promise.all(
    Array.from({ length: CONFIG.users }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          password,
          fullName: faker.person.fullName(),
          gender: faker.helpers.arrayElement([Gender.Male, Gender.Female]),
          roleId: roleListener.id,
        },
      }),
    ),
  )

  // Labels (user + recordLabel)
  const labels = await Promise.all(
    Array.from({ length: CONFIG.labels }).map(async () => {
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password,
          fullName: faker.company.name(),
          roleId: roleLabel.id,
        },
      })
      return prisma.recordLabel.create({
        data: {
          userId: user.id,
          labelName: faker.company.name(),
          labelType: faker.helpers.arrayElement([
            RecordLabelType.INDIVIDUAL,
            RecordLabelType.COMPANY,
          ]),
          hasPublicProfile: true,
        },
      })
    }),
  )

  // ===== GENRES =====
  const genres = await Promise.all(
    ['Pop', 'Rock', 'EDM', 'Jazz', 'Hip-hop', 'Classical', 'R&B', 'Country', 'Folk', 'Blues'].map(name =>
      prisma.genre.create({
        data: { genreName: name },
      }),
    ),
  )

  // ===== ALBUMS, SONGS, ASSETS, CONTRIBUTORS =====
  const songs: Song[] = [];
  // albums array is not used elsewhere, so we can remove it
  for (const label of labels) {
    for (let i = 0; i < Math.ceil(CONFIG.songs / labels.length); i++) {
      const album = await prisma.album.create({
        data: {
          albumTitle: faker.music.songName(),
          labelId: label.id,
          releaseDate: faker.date.past(),
        },
      });
      for (let j = 0; j < 2; j++) {
        const song = await prisma.song.create({
          data: {
            title: faker.music.songName(),
            duration: faker.number.int({ min: 120, max: 320 }),
            albumId: album.id,
            genreId: faker.helpers.arrayElement(genres).id,
            labelId: label.id,
            copyrightStatus: faker.helpers.enumValue(CopyrightStatus),
          },
        });
        songs.push(song);
        // SongContributor
        await prisma.songContributor.create({
          data: {
            songId: song.id,
            labelId: label.id,
            role: 'MAIN',
          },
        });
        // Asset & Rendition
        const asset = await prisma.asset.create({
          data: {
            songId: song.id,
            bucket: 'music',
            keyMaster: `${faker.string.uuid()}.flac`,
            mimeMaster: 'audio/flac',
            status: MediaStatus.Ready,
          },
        });
        await prisma.rendition.create({
          data: {
            assetId: asset.id,
            type: RenditionType.MP3,
            quality: AudioQuality.Q320kbps,
            bucket: 'music',
            key: `${faker.string.uuid()}.mp3`,
            mime: 'audio/mpeg',
            status: MediaStatus.Ready,
          },
        });
      }
    }
  }

  // ===== PLAYLISTS, PLAYLIST SONGS, FAVORITES, FOLLOWS =====
  const allPlaylists: { id: number, userId: number }[] = [];
  for (const user of users) {
    // Playlist
    const playlist = await prisma.playlist.create({
      data: {
        userId: user.id,
        playlistName: `${user.fullName}'s Playlist`,
        isPublic: true,
      },
    })
    allPlaylists.push({ id: playlist.id, userId: user.id });
    // PlaylistSong
    const playlistSongs = faker.helpers.arrayElements(songs, 5)
    for (let i = 0; i < playlistSongs.length; i++) {
      await prisma.playlistSong.create({
        data: {
          playlistId: playlist.id,
          songId: playlistSongs[i].id,
          position: i + 1,
        },
      })
    }
    // Favorite
    for (const song of faker.helpers.arrayElements(songs, 3)) {
      await prisma.favorite.create({
        data: {
          userId: user.id,
          songId: song.id,
        },
      })
    }
    // Follow (label)
    for (const label of faker.helpers.arrayElements(labels, 2)) {
      await prisma.follow.create({
        data: {
          userId: user.id,
          targetType: 'Label',
          targetId: label.id,
        },
      })
    }
  }

  // ===== FAVORITE PLAYLISTS =====
  for (const user of users) {
    // Mỗi user sẽ thích 2-4 playlist ngẫu nhiên (không phải playlist của chính mình)
    const otherPlaylists = allPlaylists.filter(p => p.userId !== user.id);
    const favPlaylists = faker.helpers.arrayElements(otherPlaylists, faker.number.int({ min: 2, max: 4 }));
    for (const pl of favPlaylists) {
      await prisma.favoritePlaylist.create({
        data: {
          userId: user.id,
          playlistId: pl.id,
        },
      });
    }
  }

  // ===== SUBSCRIPTION PLANS, USER SUBSCRIPTIONS, TRANSACTIONS =====
  await prisma.subscriptionPlan.createMany({
    data: [
      { planName: 'Free', durationMonths: 0, price: new Decimal(0) },
      { planName: 'Premium Monthly', durationMonths: 1, price: new Decimal(59000) },
    ],
  })
  const paidPlan = await prisma.subscriptionPlan.findFirstOrThrow({ where: { price: { gt: 0 } } })
  for (const user of users) {
    if (Math.random() < 0.5) continue
    const start = faker.date.recent({ days: 30 })
    const end = new Date(start)
    end.setMonth(end.getMonth() + paidPlan.durationMonths)
    const sub = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: paidPlan.id,
        startDate: start,
        endDate: end,
      },
    })
    const paymentMethod = await prisma.paymentMethod.create({ data: { methodName: 'Momo' } })
    await prisma.transaction.create({
      data: {
        userId: user.id,
        subscriptionId: sub.id,
        paymentMethodId: paymentMethod.id,
        amount: paidPlan.price,
        transactionStatus: TransactionStatus.Completed,
      },
    })
  }

  // ===== DEVICE, REFRESH TOKEN =====
  for (const user of users) {
    const device = await prisma.device.create({
      data: {
        userId: user.id,
        userAgent: faker.internet.userAgent(),
        ip: faker.internet.ip(),
      },
    })
    await prisma.refreshToken.create({
      data: {
        token: faker.string.uuid(),
        userId: user.id,
        deviceId: device.id,
        expiresAt: faker.date.future(),
      },
    })
  }

  // ===== LISTENING HISTORY, USER RATING, PREFERENCE =====
  for (const user of users) {
    for (const song of faker.helpers.arrayElements(songs, 5)) {
      await prisma.listeningHistory.create({
        data: {
          userId: user.id,
          songId: song.id,
          playedAt: faker.date.recent({ days: 10 }),
          durationListened: faker.number.int({ min: 30, max: 180 }),
          audioQuality: AudioQuality.Q320kbps,
        },
      })
      await prisma.userSongRating.create({
        data: {
          userId: user.id,
          songId: song.id,
          rating: faker.helpers.arrayElement(['Like', 'Dislike']),
        },
      })
    }
    await prisma.userPreference.create({
      data: {
        userId: user.id,
        preferredGenres: JSON.stringify(faker.helpers.arrayElements(genres.map(g => g.genreName), 2)),
        preferredLanguages: JSON.stringify(['en', 'vi']),
        explicitContent: faker.datatype.boolean(),
        autoPlay: faker.datatype.boolean(),
        highQualityStreaming: faker.datatype.boolean(),
      },
    })
  }

  // ===== ADS, AD IMPRESSION =====
  const adsArr = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.advertisement.create({
        data: {
          adName: faker.company.catchPhrase(),
          adType: AdType.Banner,
          filePath: faker.image.url(),
          startDate: faker.date.past(),
          endDate: faker.date.future(),
        },
      }),
    ),
  );
  for (let i = 0; i < 100; i++) {
    await prisma.adImpression.create({
      data: {
        adId: faker.helpers.arrayElement(adsArr).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    });
  }

  // ===== COPYRIGHT REPORT =====
  for (let i = 0; i < 10; i++) {
    await prisma.copyrightReport.create({
      data: {
        songId: faker.helpers.arrayElement(songs).id,
        reporterType: ReporterType.Listener,
        reporterId: faker.helpers.arrayElement(users).id,
        reportReason: faker.lorem.sentence(),
        status: faker.helpers.enumValue(ReportStatus),
      },
    })
  }

  // ===== DAILY STATISTIC =====
  const todayStat = new Date();
  const statDatesArr: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayStat);
    d.setDate(todayStat.getDate() - i);
    d.setHours(0, 0, 0, 0);
    statDatesArr.push(d);
  }
  for (const statDate of statDatesArr) {
    await prisma.dailyStatistic.create({
      data: {
        statDate,
        totalPlays: BigInt(faker.number.int({ min: 1000, max: 5000 })),
        uniqueListeners: faker.number.int({ min: 50, max: 300 }),
        premiumUsersCount: faker.number.int({ min: 10, max: 100 }),
        newRegistrations: faker.number.int({ min: 1, max: 20 }),
        adImpressions: BigInt(faker.number.int({ min: 100, max: 1000 })),
        revenueSubscription: new Decimal(500000),
        revenueAds: new Decimal(200000),
      },
    });
  }

  // ===== TRENDING SONGS =====
  for (const song of faker.helpers.arrayElements(songs, 5)) {
    await prisma.trendingSong.create({
      data: {
        songId: song.id,
        periodType: 'Daily',
        periodStart: statDatesArr[0],
        periodEnd: statDatesArr[statDatesArr.length - 1],
        playCount: BigInt(faker.number.int({ min: 100, max: 1000 })),
        rankPosition: faker.number.int({ min: 1, max: 10 }),
      },
    });
  }

  // ===== NOTIFICATIONS =====
  for (const user of users) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        notificationType: NotificationType.SystemUpdate,
        title: 'Welcome 🎵',
        message: 'Enjoy UIT Music!',
      },
    })
  }

  /* ========= USER SUBSCRIPTIONS ========= */
  for (const user of users) {
    if (Math.random() < 0.5) continue

    const start = faker.date.recent({ days: 30 })
    const end = new Date(start)
    end.setMonth(end.getMonth() + paidPlan.durationMonths)

    const sub = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: paidPlan.id,
        startDate: start,
        endDate: end,
      },
    })

    const paymentMethod = await prisma.paymentMethod.create({
      data: { methodName: 'Momo' },
    })

    await prisma.transaction.create({
      data: {
        userId: user.id,
        subscriptionId: sub.id,
        paymentMethodId: paymentMethod.id,
        amount: paidPlan.price,
        transactionStatus: TransactionStatus.Completed,
      },
    })
  }

  /* ========= ADS ========= */
  const ads = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.advertisement.create({
        data: {
          adName: faker.company.catchPhrase(),
          adType: AdType.Banner,
          filePath: faker.image.url(),
          startDate: faker.date.past(),
          endDate: faker.date.future(),
        },
      }),
    ),
  )

  for (let i = 0; i < 100; i++) {
    await prisma.adImpression.create({
      data: {
        adId: faker.helpers.arrayElement(ads).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    })
  }

  /* ========= COPYRIGHT REPORT ========= */
  for (let i = 0; i < 10; i++) {
    await prisma.copyrightReport.create({
      data: {
        songId: faker.helpers.arrayElement(songs).id,
        reporterType: ReporterType.Listener,
        reporterId: faker.helpers.arrayElement(users).id,
        reportReason: faker.lorem.sentence(),
        status: faker.helpers.enumValue(ReportStatus),
      },
    })
  }


  /* ========= NOTIFICATIONS ========= */
  for (const user of users) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        notificationType: NotificationType.SystemUpdate,
        title: 'Welcome 🎵',
        message: 'Enjoy UIT Music!',
      },
    })
  }

  console.log('✅ SEED SUCCESS')
}

/* ================= RUN ================= */
main()
  .catch(err => {
    console.error('❌ SEED FAILED')
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
