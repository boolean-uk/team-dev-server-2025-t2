import dbClient from '../utils/dbClient.js'
import bcrypt from 'bcrypt'

export default class User {
  /**
   * This is JSDoc - a way for us to tell other developers what types functions/methods
   * take as inputs, what types they return, and other useful information that JS doesn't have built in
   * @tutorial https://www.valentinog.com/blog/jsdoc
   *
   * @param { { id: int, cohortId: int, firstName: string, lastName: string, userName: string, email: string bio: string, githubUrl: string } } user
   * @returns {User}
   */
  static fromDb(user) {
    return new User(
      user.id,
      user.cohortId,
      user.role,
      user.firstName,
      user.lastName,
      user.userName,
      user.email,
      user.bio,
      user.githubUrl,
      user.password
    )
  }

  static async fromJson(json) {
    // eslint-disable-next-line camelcase
    const {
      firstName,
      lastName,
      userName,
      email,
      biography,
      githubUrl,
      password
    } = json

    const passwordHash = await bcrypt.hash(password, 8)

    return new User(
      null,
      null,
      'STUDENT',
      firstName,
      lastName,
      userName,
      email,
      biography,
      githubUrl,
      passwordHash
    )
  }

  constructor(
    id,
    cohortId,
    role = 'STUDENT',
    firstName,
    lastName,
    userName,
    email,
    bio,
    githubUrl,
    passwordHash = null
  ) {
    this.id = id
    this.cohortId = cohortId
    this.role = role
    this.firstName = firstName
    this.lastName = lastName
    this.userName = userName
    this.email = email
    this.bio = bio
    this.githubUrl = githubUrl
    this.passwordHash = passwordHash
  }

  toJSON() {
    return {
      user: {
        id: this.id,
        cohort_id: this.cohortId,
        role: this.role,
        firstName: this.firstName,
        lastName: this.lastName,
        userName: this.userName,
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
      role: this.role,
      firstName: this.firstName,
      lastName: this.lastName,
      userName: this.userName,
      email: this.email,
      bio: this.bio,
      githubUrl: this.githubUrl,
      password: this.passwordHash
    }

    if (this.cohortId) {
      data.cohort = {
        connectOrCreate: {
          id: this.cohortId
        }
      }
    }

    const createdUser = await dbClient.user.create({
      data
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

  static async findManyByLastName(lastName) {
    return User._findMany('lastName', lastName)
  }

  static async findAll() {
    return User._findMany()
  }

  static async _findByUnique(key, value) {
    const foundUser = await dbClient.user.findUnique({
      where: {
        [key]: value
      }
    })

    if (foundUser) {
      return User.fromDb(foundUser)
    }

    return null
  }

  static async _findMany(key, value) {
    const query = {
      select: {
        id: true,
        cohortId: true,
        role: true,
        firstName: true,
        lastName: true
      }
    }

    if (key !== undefined && value !== undefined) {
      query.where = {
        [key]: { equals: value, mode: 'insensitive' }
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
      data: {}
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

    const updatedUser = await dbClient.user.update(updateData)
    return User.fromDb(updatedUser)
  }
}
