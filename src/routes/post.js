import { Router } from 'express'
import { create, getAll, toggleLike } from '../controllers/post.js'
import { validateAuthentication } from '../middleware/auth.js'

const router = Router()

router.post('/', validateAuthentication, create)
router.get('/', validateAuthentication, getAll)
router.post('/:id/toggle-like', validateAuthentication, toggleLike)

export default router
