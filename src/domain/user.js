import dbClient from '../utils/dbClient.js'
import bcrypt from 'bcrypt'

export default class User {
  /**
   * This is JSDoc - a way for us to tell other developers what types functions/methods
   * take as inputs, what types they return, and other useful information that JS doesn't have built in
   * @tutorial https://www.valentinog.com/blog/jsdoc
   *
   * @param { { id: int, cohortId: int, email: string, profile: { firstName: string, lastName: string, bio: string, githubUrl: string } } } user
   * @returns {User}
   */
  static fromDb(user) {
    return new User(
      user.id,
      user.cohortId,
      user.profile?.firstName,
      user.profile?.lastName,
      user.email,
      user.profile?.bio,
      user.profile?.githubUrl,
      user.password,
      user.role
    )
  }

  static async fromJson(json) {
    // eslint-disable-next-line camelcase
    const { firstName, lastName, email, biography, githubUrl, password } = json

    const passwordHash = await bcrypt.hash(password, 8)

    return new User(
      null,
      null,
      firstName,
      lastName,
      email,
      biography,
      githubUrl,
      passwordHash
    )
  }

  constructor(
    id,
    cohortId,
    firstName,
    lastName,
    email,
    bio,
    githubUrl,
    passwordHash = null,
    role = 'STUDENT'
  ) {
    this.id = id
    this.cohortId = cohortId
    this.firstName = firstName
    this.lastName = lastName
    this.email = email
    this.bio = bio
    this.githubUrl = githubUrl
    this.passwordHash = passwordHash
    this.role = role
  }

  toJSON() {
    return {
      user: {
        id: this.id,
        cohort_id: this.cohortId,
        role: this.role,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        biography: this.bio,
        githubUrl: this.githubUrl
      }
    }
  }

  /**
   * @returns {User}
   *  A user instance containing an ID, representing the user data created in the database
   */
  async save() {
    const data = {
      email: this.email,
      password: this.passwordHash,
      role: this.role
    }

    if (this.cohortId) {
      data.cohort = {
        connectOrCreate: {
          id: this.cohortId
        }
      }
    }

    if (this.firstName && this.lastName) {
      data.profile = {
        create: {
          firstName: this.firstName,
          lastName: this.lastName,
          bio: this.bio,
          githubUrl: this.githubUrl
        }
      }
    }
    const createdUser = await dbClient.user.create({
      data,
      include: {
        profile: true
      }
    })

    return User.fromDb(createdUser)
  }

  static async findByEmail(email) {
    return User._findByUnique('email', email)
  }

  static async findById(id) {
    return User._findByUnique('id', id)
  }

  static async findManyByFirstName(firstName) {
    return User._findMany('firstName', firstName)
  }

  static async findAll() {
    return User._findMany()
  }

  static async _findByUnique(key, value) {
    const foundUser = await dbClient.user.findUnique({
      where: {
        [key]: value
      },
      include: {
        profile: true
      }
    })

    if (foundUser) {
      return User.fromDb(foundUser)
    }

    return null
  }

  static async _findMany(key, value) {
    const query = {
      include: {
        profile: true
      }
    }

    if (key !== undefined && value !== undefined) {
      query.where = {
        profile: {
          [key]: value
        }
      }
    }

    const foundUsers = await dbClient.user.findMany(query)

    return foundUsers.map((user) => User.fromDb(user))
  }

  async update(data) {
    const updateData = {
      where: {
        id: this.id
      },
      data: {},
      include: {
        profile: true
      }
    }

    // Handle user-level updates
    if (data.email && data.email !== 'string')
      updateData.data.email = data.email
    if (data.passwordHash) updateData.data.password = data.passwordHash
    if (data.role && (data.role === 'STUDENT' || data.role === 'TEACHER')) {
      updateData.data.role = data.role
    }
    if (typeof data.cohortId === 'number') {
      updateData.data.cohortId = data.cohortId
    }

    // Handle profile-related updates
    const profileUpdates = {}
    let hasProfileUpdates = false

    if (data.firstName && data.firstName !== 'string') {
      profileUpdates.firstName = data.firstName
      hasProfileUpdates = true
    }
    if (data.lastName && data.lastName !== 'string') {
      profileUpdates.lastName = data.lastName
      hasProfileUpdates = true
    }
    if (data.bio && data.bio !== 'string') {
      profileUpdates.bio = data.bio
      hasProfileUpdates = true
    }
    if (data.githubUrl && data.githubUrl !== 'string') {
      profileUpdates.githubUrl = data.githubUrl
      hasProfileUpdates = true
    }

    if (hasProfileUpdates) {
      updateData.data.profile = {
        update: profileUpdates
      }
    }

    const updatedUser = await dbClient.user.update(updateData)
    return User.fromDb(updatedUser)
  }
}
