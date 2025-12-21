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
      "payment_methods","users","roles"
    RESTART IDENTITY CASCADE
  `)

  const password = await bcrypt.hash('password123', 10)

  /* ========= ROLES ========= */
  const roleListener = await prisma.role.create({
    data: { name: 'Listener' },
  })

  const roleLabel = await prisma.role.create({
    data: { name: 'Label' },
  })

  /* ========= USERS ========= */
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

  /* ========= GENRES ========= */
  const genres = await Promise.all(
    ['Pop', 'Rock', 'EDM', 'Jazz', 'Hip-hop'].map(name =>
      prisma.genre.create({
        data: { genreName: name },
      }),
    ),
  )

  /* ========= RECORD LABELS (ARTIST / COMPANY) ========= */
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

  /* ========= SONGS + ALBUMS + ASSETS ========= */
  const songs: Song[] = []

  for (let i = 0; i < CONFIG.songs; i++) {
    const label = faker.helpers.arrayElement(labels)

    const album = await prisma.album.create({
      data: {
        albumTitle: faker.music.songName(),
        labelId: label.id,
        releaseDate: faker.date.past(),
      },
    })

    const song = await prisma.song.create({
      data: {
        title: faker.music.songName(),
        duration: faker.number.int({ min: 120, max: 320 }),
        albumId: album.id,
        genreId: faker.helpers.arrayElement(genres).id,
        labelId: label.id,
        copyrightStatus: faker.helpers.enumValue(CopyrightStatus),
      },
    })

    const asset = await prisma.asset.create({
      data: {
        songId: song.id,
        bucket: 'music',
        keyMaster: `${faker.string.uuid()}.flac`,
        mimeMaster: 'audio/flac',
        status: MediaStatus.Ready,
      },
    })

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
    })

    songs.push(song)
  }

  /* ========= SUBSCRIPTION PLANS ========= */
  await prisma.subscriptionPlan.createMany({
    data: [
      { planName: 'Free', durationMonths: 0, price: new Decimal(0) },
      {
        planName: 'Premium Monthly',
        durationMonths: 1,
        price: new Decimal(59000),
      },
    ],
  })

  const paidPlan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { price: { gt: 0 } },
  })

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

  /* ========= DAILY STAT ========= */
  for (let i = 0; i < 7; i++) {
    await prisma.dailyStatistic.create({
      data: {
        statDate: faker.date.recent({ days: 7 }),
        totalPlays: BigInt(faker.number.int({ min: 1000, max: 5000 })),
        uniqueListeners: faker.number.int({ min: 50, max: 300 }),
        premiumUsersCount: faker.number.int({ min: 10, max: 100 }),
        newRegistrations: faker.number.int({ min: 1, max: 20 }),
        adImpressions: BigInt(faker.number.int({ min: 100, max: 1000 })),
        revenueSubscription: new Decimal(500000),
        revenueAds: new Decimal(200000),
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
