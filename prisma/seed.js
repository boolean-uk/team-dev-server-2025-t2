import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
const prisma = new PrismaClient()

async function seed() {
  // Create 3 cohorts
  const cohort1 = await createCohort()
  const cohort2 = await createCohort()
  const cohort3 = await createCohort()

  // Create 3 students
  const student1 = await createUser(
    'student1@test.com',
    'Testpassword1!',
    cohort1.id,
    'student1username',
    'firstName1',
    'lastName1',
    'Student 1 bio',
    'student1'
  )
  const student2 = await createUser(
    'student2@test.com',
    'Testpassword1!',
    cohort2.id,
    'student2username',
    'firstName2',
    'lastName2',
    'Student 2 bio',
    'student2'
  )
  const student3 = await createUser(
    'student3@test.com',
    'Testpassword1!',
    cohort3.id,
    'student3username',
    'firstName3',
    'lastName3',
    'Student 3 bio',
    'student3'
  )
  // Create 3 teachers
  const teacher1 = await createUser(
    'teacher1@test.com',
    'Testpassword1!',
    null,
    'teacher1username',
    'teacherFirst1',
    'teacherLast1',
    'Teacher 1 bio',
    'teacher1',
    'TEACHER'
  )
  const teacher2 = await createUser(
    'teacher2@test.com',
    'Testpassword1!',
    null,
    'teacher2username',
    'teacherFirst2',
    'teacherLast2',
    'Teacher 2 bio',
    'teacher2',
    'TEACHER'
  )
  const teacher3 = await createUser(
    'teacher3@test.com',
    'Testpassword1!',
    null,
    'teacher3username',
    'teacherFirst3',
    'teacherLast3',
    'Teacher 3 bio',
    'teacher3',
    'TEACHER'
  )

  // Create 3 posts for each user
  await createPost(student1.id, 'Student 1 first post!')
  await createPost(student1.id, 'Student 1 second post!')
  await createPost(student1.id, 'Student 1 third post!')

  await createPost(student2.id, 'Student 2 first post!')
  await createPost(student2.id, 'Student 2 second post!')
  await createPost(student2.id, 'Student 2 third post!')

  await createPost(student3.id, 'Student 3 first post!')
  await createPost(student3.id, 'Student 3 second post!')
  await createPost(student3.id, 'Student 3 third post!')

  await createPost(teacher1.id, 'Teacher 1 first post!')
  await createPost(teacher1.id, 'Teacher 1 second post!')
  await createPost(teacher1.id, 'Teacher 1 third post!')

  await createPost(teacher2.id, 'Teacher 2 first post!')
  await createPost(teacher2.id, 'Teacher 2 second post!')
  await createPost(teacher2.id, 'Teacher 2 third post!')

  await createPost(teacher3.id, 'Teacher 3 first post!')
  await createPost(teacher3.id, 'Teacher 3 second post!')
  await createPost(teacher3.id, 'Teacher 3 third post!')

  process.exit(0)
}

async function createPost(userId, content) {
  const post = await prisma.post.create({
    data: {
      userId,
      content,
      likes: {
        create: [{ userId: userId === 1 ? 2 : 1 }]
      },
      comments: {
        create: [
          {
            content: 'Great post!',
            userId: userId === 1 ? 2 : 1
          }
        ]
      }
    },
    include: {
      user: true,
      likes: true,
      comments: true
    }
  })

  console.info('Post created', post)

  return post
}

async function createCohort() {
  const cohort = await prisma.cohort.create({
    data: {
      type: 'SOFTWARE_DEVELOPMENT',
      cohortNumber: 1
    }
  })

  console.info('Cohort created', cohort)

  return cohort
}

async function createUser(
  email,
  password,
  cohortId,
  userName,
  firstName,
  lastName,
  bio,
  githubUrl,
  role = 'STUDENT'
) {
  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 8),
      cohortId,
      userName,
      firstName,
      lastName,
      bio,
      githubUrl,
      role
    }
  })

  console.info(`${role} created`, user)

  return user
}

seed().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
