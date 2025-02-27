import { Router } from 'express'
import {
  create,
  getAll,
  editPostById,
  toggleLike,
  deletePost
} from '../controllers/post.js'
import { validateAuthentication } from '../middleware/auth.js'

const router = Router()

router.post('/', validateAuthentication, create)
router.get('/', validateAuthentication, getAll)
router.post('/:id/toggle-like', validateAuthentication, toggleLike)
router.patch('/:id', validateAuthentication, editPostById)
router.delete('/:id', validateAuthentication, deletePost)

export default router
