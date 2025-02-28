import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import dbClient from '../utils/dbClient.js'

export const createComment = async (req, res) => {
  const { content } = req.body
  const postId = parseInt(req.params.postId)
  const userId = req.user.id

  try {
    // Input validation
    if (!content || content.trim().length === 0) {
      return sendDataResponse(res, 400, {
        content: 'Comment content cannot be empty'
      })
    }

    const MAX_COMMENT_LENGTH = 2560
    if (content.length > MAX_COMMENT_LENGTH) {
      return sendDataResponse(res, 400, {
        content: `Comment content cannot exceed ${MAX_COMMENT_LENGTH} characters`
      })
    }

    // Check if post exists
    const post = await dbClient.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return sendDataResponse(res, 404, {
        post: 'Post not found'
      })
    }

    // Create comment
    const comment = await dbClient.postComment.create({
      data: {
        content: content.trim(),
        postId,
        userId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Format response
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.user.id,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName
      }
    }

    return sendDataResponse(res, 201, { comment: formattedComment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return sendMessageResponse(res, 500, 'Unable to create comment')
  }
}
