import { Router } from 'express'
import {
  create,
  getById,
  getAll,
  updateById,
  getUserProgress
} from '../controllers/user.js'
import { validateAuthentication } from '../middleware/auth.js'

const router = Router()

router.post('/', create)
router.get('/', validateAuthentication, getAll)
router.get('/:id', validateAuthentication, getById)
router.patch('/:id', validateAuthentication, updateById)
router.get('/:id/progress', validateAuthentication, getUserProgress)

export default router
