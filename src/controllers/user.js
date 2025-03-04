import validator from 'validator'
import User from '../domain/user.js'
import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const create = async (req, res) => {
  const userToCreate = await User.fromJson(req.body)
  const password = await req.body.password
  const missingPasswordMatch = []

  try {
    if (!validator.isEmail(userToCreate.email)) {
      return sendDataResponse(res, 400, { email: 'Invalid email format' })
    }

    const existingUser = await User.findByEmail(userToCreate.email)
   /* eslint-disable */
   if (password.length < 8) {
    missingPasswordMatch.push('Password must be at least 8 characters long')
  }
  if (!/[A-Za-z]/.test(password)) {
    missingPasswordMatch.push('Password must contain at least one letter')
  }
  if (!/[A-Z]/.test(password)) {
    missingPasswordMatch.push('Password must contain at least one uppercase letter')
  }
  if (!/\d/.test(password)) {
    missingPasswordMatch.push('Password must contain at least one number')
  }
  if (!/[@$!%*?&]/.test(password)) {
    missingPasswordMatch.push('Password must contain at least one special character')
  }

  if (missingPasswordMatch.length > 0) {
    return sendDataResponse(res, 400, { password: missingPasswordMatch })
  }

  /* eslint-enable */

    if (existingUser) {
      return sendDataResponse(res, 400, { email: 'Email already in use' })
    }

    const createdUser = await userToCreate.save()

    return sendDataResponse(res, 201, createdUser)
  } catch (error) {
    return sendMessageResponse(res, 500, 'Unable to create new user')
  }
}

export const getById = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const foundUser = await User.findById(id)

    if (!foundUser) {
      return sendDataResponse(res, 404, { id: 'User not found' })
    }

    return sendDataResponse(res, 200, foundUser)
  } catch (e) {
    return sendMessageResponse(res, 500, 'Unable to get user')
  }
}

export const getAll = async (req, res) => {
  // eslint-disable-next-line camelcase
  const { firstName, lastName } = req.query

  let foundUsers
  let firstNameUsers
  let lastNameUsers

  const namePattern = /^[a-zA-Z\s-']{1,50}$/

  try {
    if (
      firstName &&
      !namePattern.test(firstName) &&
      lastName &&
      !namePattern.test(lastName)
    ) {
      return sendDataResponse(res, 400, {
        error: 'Invalid first name and last name format.'
      })
    }
    if (firstName && !namePattern.test(firstName)) {
      return sendDataResponse(res, 400, { error: 'Invalid first name format.' })
    }
    if (lastName && !namePattern.test(lastName)) {
      return sendDataResponse(res, 400, { error: 'Invalid last name format.' })
    }

    if (firstName && lastName) {
      firstNameUsers = await User.findManyByFirstName(firstName)
      lastNameUsers = await User.findManyByLastName(lastName)
      foundUsers = firstNameUsers.filter((user) =>
        lastNameUsers.some((u) => u.id === user.id)
      )
    } else if (firstName) {
      foundUsers = await User.findManyByFirstName(firstName)
    } else if (lastName) {
      foundUsers = await User.findManyByLastName(lastName)
    } else {
      foundUsers = await User.findAll()
    }

    if (!foundUsers || foundUsers.length === 0) {
      return sendDataResponse(res, 404, { error: 'No users found.' })
    }
    const formattedUsers = foundUsers.map((user) => {
      return {
        ...user.toJSON().user
      }
    })
    return sendDataResponse(res, 200, { users: formattedUsers })
  } catch (error) {
    return sendDataResponse(res, 500, {
      error: 'An unexpected error occurred.'
    })
  }
}

export const updateById = async (req, res) => {
  const userId = parseInt(req.params.id)
  const {
    firstName,
    lastName,
    email,
    biography,
    githubUrl,
    password,
    cohort_id: cohortIdSnake,
    cohortId: cohortIdCamel,
    role,
    mobile
  } = req.body

  // Input validation patterns
  const validationPatterns = {
    name: /^[a-zA-Z\s-']{2,50}$/,
    email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password:
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    biography: /^[\s\S]{0,500}$/,
    githubUrl: /^https:\/\/github\.com\/[a-zA-Z0-9-]+$/,
    role: /^(STUDENT|TEACHER)$/,
    mobile: /^\+?[1-9]\d{1,14}$/
  }

  // Validation helper function
  const validateField = (field, value, pattern) => {
    if (value === undefined || value === null || value === '') return true
    return pattern.test(value)
  }

  // Validate input fields
  const validationErrors = {}

  if (
    firstName &&
    !validateField('firstName', firstName, validationPatterns.name)
  ) {
    validationErrors.firstName = 'Invalid first name format'
  }
  if (
    lastName &&
    !validateField('lastName', lastName, validationPatterns.name)
  ) {
    validationErrors.lastName = 'Invalid last name format'
  }
  if (email && !validateField('email', email, validationPatterns.email)) {
    validationErrors.email = 'Invalid email format'
  }
  if (
    biography &&
    !validateField('biography', biography, validationPatterns.biography)
  ) {
    validationErrors.biography = 'Biography must not exceed 500 characters'
  }
  if (
    githubUrl &&
    !validateField('githubUrl', githubUrl, validationPatterns.githubUrl)
  ) {
    validationErrors.githubUrl = 'Invalid GitHub URL format'
  }
  if (
    password &&
    !validateField('password', password, validationPatterns.password)
  ) {
    validationErrors.password =
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*#?&)'
  }
  if (role && !validateField('role', role, validationPatterns.role)) {
    validationErrors.role = 'Invalid role'
  }
  if (mobile && !validateField('mobile', mobile, validationPatterns.mobile)) {
    validationErrors.mobile = 'Invalid mobile number format'
  }

  // Check for validation errors
  if (Object.keys(validationErrors).length > 0) {
    return sendDataResponse(res, 400, { validation: validationErrors })
  }

  const cohortId = cohortIdSnake ?? cohortIdCamel

  try {
    // Find the user using Prisma client
    const userToUpdate = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    if (!userToUpdate) {
      return sendDataResponse(res, 404, { id: 'User not found' })
    }

    // Check if user is updating their own profile or is a teacher
    const isOwnProfile = req.user.id === userId
    const isTeacher = req.user.role === 'TEACHER'

    if (!isOwnProfile && !isTeacher) {
      return sendDataResponse(res, 403, {
        authorization: 'You are not authorized to update this profile'
      })
    }

    // Check if student is trying to update restricted fields
    if (!isTeacher && (cohortId || role)) {
      return sendDataResponse(res, 403, {
        authorization:
          'Students cannot modify cohort or role information. Please contact a teacher for these changes.'
      })
    }

    // Create update data object
    const updateData = {}

    // Helper function to validate and add field if it has a valid value
    const addValidField = (field, value) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'string'
      ) {
        updateData[field] = value
      }
    }

    // Profile fields any user can update on their own profile
    if (isOwnProfile) {
      if (password && typeof password === 'string') {
        updateData.passwordHash = await bcrypt.hash(password, 8)
      }
    }

    // Fields only teachers can update
    if (isTeacher) {
      if (cohortId !== undefined) {
        const cohortIdInt = parseInt(cohortId, 10)
        if (!isNaN(cohortIdInt)) {
          updateData.cohortId = cohortIdInt
        }
      }
      if (role === 'STUDENT' || role === 'TEACHER') {
        updateData.role = role
      }
    }

    // Profile fields any user can update on their own profile
    if (isOwnProfile || isTeacher) {
      addValidField('firstName', firstName)
      addValidField('lastName', lastName)
      addValidField('bio', biography)
      addValidField('githubUrl', githubUrl)
      addValidField('email', email)
      addValidField('mobile', mobile)
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return sendDataResponse(res, 400, {
        fields: 'No valid fields provided for update'
      })
    }

    // Update the user using Prisma client
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: updateData
    })

    return sendDataResponse(res, 200, updatedUser)
  } catch (error) {
    return sendMessageResponse(
      res,
      500,
      `Unable to update user: ${error.message}`
    )
  }
}

// Function for retrieving user progress
export const getUserProgress = async (req, res) => {
  const userId = parseInt(req.params.id)
  const currentUser = req.user

  // Check if user is authorized to view progress
  if (currentUser.role !== 'TEACHER' && currentUser.id !== userId) {
    return sendDataResponse(res, 403, {
      error: 'You are not authorized to view this user progress'
    })
  }

  try {
    // Using json sample-data as requested
    const progressData = {
      CompletedModules: {
        completed: 2,
        total: 7
      },
      CompletedUnits: {
        completed: 4,
        total: 10
      },
      CompletedExercises: {
        completed: 34,
        total: 58
      }
    }
    return sendDataResponse(res, 200, progressData)
  } catch (error) {
    console.error('Failed to retrieve user progress:', error)
    return sendMessageResponse(res, 500, 'Failed to retrieve user progress')
  }
}
