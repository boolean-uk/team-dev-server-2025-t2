import { Router } from 'express'
import { create, getCohortMembers } from '../controllers/cohort.js'
import {
  validateAuthentication,
  validateTeacherRole,
  validateCohortAccess
} from '../middleware/auth.js'

const router = Router()

router.post('/', validateAuthentication, validateTeacherRole, create)
router.get(
  '/:id/members',
  validateAuthentication,
  validateCohortAccess,
  getCohortMembers
)

export default router
