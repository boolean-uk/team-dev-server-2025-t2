import { sendDataResponse, sendMessageResponse } from '../utils/responses.js'
import dbClient from '../utils/dbClient.js'

export const create = async (req, res) => {
  const { content } = req.body

  if (!content) {
    return sendDataResponse(res, 400, { content: 'Must provide content' })
  }

  return sendDataResponse(res, 201, { post: { id: 1, content } })
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
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            },
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
        firstName: post.user.profile.firstName,
        lastName: post.user.profile.lastName,
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
