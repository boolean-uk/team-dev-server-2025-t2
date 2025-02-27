import { Router } from 'express'
import {
  create,
  getAll,
  editPostById,
  toggleLike
} from '../controllers/post.js'
import { validateAuthentication } from '../middleware/auth.js'

const router = Router()

router.post('/', validateAuthentication, create)
router.get('/', validateAuthentication, getAll)
router.post('/:id/toggle-like', validateAuthentication, toggleLike)
router.patch('/:id', validateAuthentication, editPostById)

export default router
