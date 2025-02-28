import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import dbClient from '../utils/dbClient.js'

export const create = async (req, res) => {
  const { content } = req.body

  if (!content) {
    return sendDataResponse(res, 400, { content: 'Must provide content' })
  }

  if (!req.user) {
    return sendDataResponse(res, 401, { error: 'Authentication required' })
  }

  try {
    const newPost = await dbClient.post.create({
      data: {
        content,
        userId: req.user.id
      }
    })

    return sendDataResponse(res, 201, { post: newPost })
  } catch (error) {
    console.error('Error creating post:', error)
    return sendMessageResponse(res, 500, 'Unable to create post')
  }
}

export const getAll = async (req, res) => {
  try {
    const posts = await dbClient.post.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          include: {
            cohort: {
              select: {
                id: true,
                type: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: {
        id: post.user.id,
        firstName: post.user.firstName,
        lastName: post.user.lastName,
        cohort: post.user.cohort
      },
      stats: {
        likes: post._count.likes,
        comments: post._count.comments
      }
    }))

    return sendDataResponse(res, 200, { posts: formattedPosts })
  } catch (error) {
    return sendMessageResponse(res, 500, 'Unable to fetch posts')
  }
}

export const toggleLike = async (req, res) => {
  const postId = parseInt(req.params.id)
  const userId = req.user.id

  try {
    // Check if user is authenticated
    if (!req.user) {
      return sendDataResponse(res, 401, {
        authorization: 'You must be logged in to perform this action'
      })
    }

    // Check if post exists
    const post = await dbClient.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return sendDataResponse(res, 404, { error: 'Post not found' })
    }

    // Check if user has already liked the post
    const existingLike = await dbClient.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    })

    if (existingLike) {
      // Unlike: Remove the like
      await dbClient.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId
          }
        }
      })
    } else {
      // Like: Create new like
      await dbClient.postLike.create({
        data: {
          postId,
          userId
        }
      })
    }

    // Get updated like count
    const likeCount = await dbClient.postLike.count({
      where: {
        postId
      }
    })

    return sendDataResponse(res, 200, {
      liked: !existingLike,
      likeCount
    })
  } catch (error) {
    console.error('Error toggling post like:', error)
    return sendMessageResponse(res, 500, 'Unable to process like/unlike action')
  }
}

export const editPostById = async (req, res) => {
  const { id } = req.params
  const { content } = req.body

  const currPost = await dbClient.post.findUnique({
    where: {
      id: parseInt(id)
    }
  })

  const userId = req.user.id

  if (currPost.userId !== userId) {
    return sendDataResponse(res, 403, { error: 'Unauthorized' })
  }

  if (currPost === null) {
    return sendDataResponse(res, 404, { content: 'Not found' })
  }

  try {
    const updatedPost = await dbClient.post.update({
      where: { id: parseInt(id) },
      data: { content }
    })

    return sendDataResponse(res, 201, { post: updatedPost })
  } catch (error) {
    return sendMessageResponse(res, 500, 'Unable to update post')
  }
}

export const deletePost = async (req, res) => {
  const { id } = req.params
  const currentUser = req.user.id

  try {
    const post = await dbClient.post.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    })

    if (post.user.id !== currentUser) {
      return sendDataResponse(res, 403, { post: 'User not authorized' })
    }

    await dbClient.post.delete({
      where: { id: parseInt(id) }
    })

    return sendDataResponse(res, 204, {})
  } catch (error) {
    return sendMessageResponse(res, 404, 'Post not found')
  }
}
