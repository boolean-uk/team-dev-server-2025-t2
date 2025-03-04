import { createCohort } from '../domain/cohort.js'
import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import dbClient from '../utils/dbClient.js'

export const cohortTypeDisplay = {
  SOFTWARE_DEVELOPMENT: 'Software Development',
  FRONTEND_DEVELOPMENT: 'Front-End Development',
  DATA_ANALYTICS: 'Data Analytics'
}

export const create = async (req, res) => {
  try {
    const createdCohort = await createCohort()

    return sendDataResponse(res, 201, createdCohort)
  } catch (e) {
    return sendMessageResponse(res, 500, 'Unable to create cohort')
  }
}

export const getCohortMembers = async (req, res) => {
  const cohortId = parseInt(req.params.id)

  try {
    const cohortMembers = await dbClient.user.findMany({
      where: {
        cohortId: cohortId
      },
      select: {
        id: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    const cohort = await dbClient.cohort.findUnique({
      where: {
        id: cohortId
      },
      select: {
        id: true,
        type: true
      }
    })

    if (!cohortMembers.length) {
      return sendDataResponse(res, 404, {
        cohort: 'No members found in this cohort'
      })
    }

    const formattedMembers = {
      students: [],
      teachers: []
    }

    cohortMembers.forEach((member) => {
      const formattedMember = {
        id: member.id,
        firstName: member.profile.firstName,
        lastName: member.profile.lastName
      }

      if (member.role === 'TEACHER') {
        formattedMembers.teachers.push(formattedMember)
      } else {
        formattedMembers.students.push(formattedMember)
      }
    })

    return sendDataResponse(res, 200, {
      cohort: {
        id: cohort.id,
        type: cohortTypeDisplay[cohort.type]
      },
      members: formattedMembers
    })
  } catch (error) {
    return sendMessageResponse(res, 500, 'Unable to fetch cohort members')
  }
}
