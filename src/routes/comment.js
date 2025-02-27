import { Router } from 'express'
import { createComment } from '../controllers/comment.js'
import { validateAuthentication } from '../middleware/auth.js'

const router = Router()

router.post('/posts/:postId/comments', validateAuthentication, createComment)

export default router
