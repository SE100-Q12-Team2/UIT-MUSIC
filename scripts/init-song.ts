import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Tạo Label trước (vì Song cần labelId)
  const labelFirst = await prisma.recordLabel.create({
    data: {
      user: {
        create: {
          email: 'label@test.com',
          password: 'hashed_password_here',
          fullName: 'Test Label Owner',
          role: {
            connect: { id: 2 }, // giả sử RoleId = 2 là Label
          },
        },
      },
      labelName: 'Test Label',
      description: 'A demo record label for testing upload feature',
      contactEmail: 'contact@testlabel.com',
      hasPublicProfile: true,
    },
  })

   const labelSecond = await prisma.recordLabel.create({
    data: {
      user: {
        create: {
          email: 'label2@test.com',
          password: 'hashed_password_here',
          fullName: 'Test Label Owner',
          role: {
            connect: { id: 2 }, // giả sử RoleId = 2 là Label
          },
        },
      },
      labelName: 'Test Label',
      description: 'A demo record label for testing upload feature',
      contactEmail: 'contact@testlabel.com',
      hasPublicProfile: true,
    },
  })

  // Genre
  const genre = await prisma.genre.create({
    data: {
      genreName: 'Pop',
      description: 'Popular music',
    },
  })

  // Album
  const album = await prisma.album.create({
    data: {
      albumTitle: 'Test Album',
      albumDescription: 'Demo album for testing',
      releaseDate: new Date(),
      labelId: labelFirst.id,
    },
  })

  // Bài hát 1
  const song1 = await prisma.song.create({
    data: {
      title: 'Hello World',
      description: 'First test song',
      duration: 0, // sẽ cập nhật sau khi ingest xong
      albumId: album.id,
      genreId: genre.id,
      labelId: labelFirst.id,
    },
  })

  // Bài hát 2
  const song2 = await prisma.song.create({
    data: {
      title: 'Second Song',
      description: 'Another test track',
      duration: 0,
      albumId: album.id,
      genreId: genre.id,
      labelId: labelFirst.id,
    },
  })

  // Bài hát 2
  const song3 = await prisma.song.create({
    data: {
      title: 'Third Song',
      description: 'Another test track',
      duration: 0,
      albumId: album.id,
      genreId: genre.id,
      labelId: labelFirst.id,
    },
  })

  console.log('Seeded songs:', { song1, song2, song3 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
