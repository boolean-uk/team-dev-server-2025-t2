import validator from 'validator'
import User from '../domain/user.js'
import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import bcrypt from 'bcrypt'

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
  const { first_name: firstName } = req.query

  let foundUsers

  if (firstName) {
    foundUsers = await User.findManyByFirstName(firstName)
  } else {
    foundUsers = await User.findAll()
  }

  const formattedUsers = foundUsers.map((user) => {
    return {
      ...user.toJSON().user
    }
  })

  return sendDataResponse(res, 200, { users: formattedUsers })
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
    role
  } = req.body

  // Input validation patterns
  const validationPatterns = {
    name: /^[a-zA-Z\s-']{2,50}$/,
    email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password:
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    biography: /^[\s\S]{0,500}$/,
    githubUrl: /^https:\/\/github\.com\/[a-zA-Z0-9-]+$/,
    role: /^(STUDENT|TEACHER)$/
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

  // Check for validation errors
  if (Object.keys(validationErrors).length > 0) {
    return sendDataResponse(res, 400, { validation: validationErrors })
  }

  const cohortId = cohortIdSnake ?? cohortIdCamel

  try {
    const userToUpdate = await User.findById(userId)

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
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return sendDataResponse(res, 400, {
        fields: 'No valid fields provided for update'
      })
    }

    const updatedUser = await userToUpdate.update(updateData)

    return sendDataResponse(res, 200, updatedUser)
  } catch (error) {
    return sendMessageResponse(
      res,
      500,
      `Unable to update user: ${error.message}`
    )
  }
}
