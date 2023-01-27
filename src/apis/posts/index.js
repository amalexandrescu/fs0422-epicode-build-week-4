import express, { response } from 'express'
import { model } from 'mongoose'
import posts from './model.js'
import createHttpError from 'http-errors'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import UsersModel from '../users/model.js'

const postsRouter = express.Router()

const postCoverPhoto = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'LinkedIn',
    },
  }),
}).single('postPhoto')

//Add a new post
postsRouter.post('/', async (request, response, next) => {
  try {
    const newPost = new posts(request.body)
    const { _id } = await newPost.save()
    response.status(200).send({ _id })
  } catch (error) {
    next(error)
  }
})

//Get all posts
postsRouter.get('/', async (request, response, next) => {
  try {
    const getPosts = await posts
      .find({})
      .populate({ path: 'user', select: 'name surname image' })
      .populate({ path: 'likes', select: 'name surname image' })
    response.status(200).send(getPosts)
  } catch (err) {
    next(err)
  }
})

//Get post by ID
postsRouter.get('/:postID', async (request, response, next) => {
  try {
    const getPost = await posts.findById(request.params.postID)

    if (getPost) {
      response.status(200).send(getPost)
    } else {
      next(
        createHttpError(
          404,
          `Unable to find post with ID ${request.params.postID}`,
        ),
      )
    }
  } catch (err) {
    next(err)
  }
})

//Edit a post
postsRouter.put('/:postID', async (request, response, next) => {
  try {
    const post = await posts.findByIdAndUpdate(
      request.params.postID,
      request.body,
      { new: true },
    )
    response.status(200).send(post)
  } catch (error) {
    next(err)
  }
})

//Delete a post
postsRouter.delete('/:postID', async (request, response, next) => {
  try {
    const post = await posts.findByIdAndDelete(request.params.postID)

    if (post) {
      response.status(204).send()
    } else {
      next(
        createHttpError(
          404,
          `There was no post with the ID ${request.params.postID}. Nothing has been deleted.`,
        ),
      )
    }
  } catch (err) {
    next(err)
  }
})

//Upload an image and attach it to a post
postsRouter.post(
  '/:postID/uploadPostImage',
  postCoverPhoto,
  async (request, response, next) => {
    try {
      const url = request.file.path

      const post = await posts.findByIdAndUpdate(request.params.postID, {
        image: url,
      })
      response.status(200).send('Image uploaded')
    } catch (err) {
      next(err)
    }
  },
)

// *************************** COMMENTS ***************************

postsRouter.post('/:postId/comment', async (req, res, next) => {
  //in req.body we pot the comment and the user id
  try {
    const searchedPost = await posts.findById(req.params.postId).limit(2)

    if (searchedPost) {
      const updatedPost = await posts.findByIdAndUpdate(
        req.params.postId,
        {
          $push: { comments: { ...req.body } },
        },
        { new: true, runValidators: true },
      )
      res.send(updatedPost)
    } else {
      next(createHttpError(404, `Post with id ${req.params.postId} not found`))
    }
  } catch (error) {
    next(error)
  }
})

postsRouter.get('/:postId/comment', async (req, res, next) => {
  try {
    const currentPost = await posts
      .findById(req.params.postId)
      .populate({ path: 'comments.userId', select: 'name surname image' })
    if (currentPost) {
      res.send(currentPost.comments)
    } else {
      next(createHttpError(404, `Post with id ${req.params.postId} not found`))
    }
  } catch (error) {
    next(error)
  }
})

postsRouter.delete('/:postId/comment/:commentId', async (req, res, next) => {
  try {
    const updatedPost = await posts.findByIdAndUpdate(
      req.params.postId,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true },
    )
    if (updatedPost) {
      res.send(updatedPost)
    } else {
      next(createHttpError(404, `Post with id ${req.params.postId} not found`))
    }
  } catch (error) {
    next(error)
  }
})

postsRouter.put('/:postId/comment/:commentId', async (req, res, next) => {
  try {
    const searchedPost = await posts.findById(req.params.postId)

    if (searchedPost) {
      const index = searchedPost.comments.findIndex(
        (comment) => comment._id.toString() === req.params.commentId,
      )

      if (index !== -1) {
        searchedPost.comments[index] = {
          ...searchedPost.comments[index].toObject(),
          ...req.body,
        }
        await searchedPost.save()
        res.send(searchedPost)
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found`,
          ),
        )
      }
    } else {
      next(createHttpError(404, `Post with id ${req.params.postId} not found`))
    }
  } catch (error) {
    next(error)
  }
})

// *************************** LIKES ***************************

postsRouter.post('/:postID/like', async (req, res, next) => {
  try {
    //in the req.body we'll get the userId;

    const { userId } = req.body

    const post = await posts.findById(req.params.postID)

    if (!post) {
      return next(
        createHttpError(404, `Post with id ${req.params.postID} not found`),
      )
    }

    const user = await UsersModel.findById(userId)

    if (!user) {
      return next(createHttpError(404, `User with id ${userId} not found`))
    }

    const checkLike = post.likes.findIndex(
      (like) => like.toString() === userId.toString(),
    )
    if (checkLike === -1) {
      const modifiedPost = await posts
        .findByIdAndUpdate(
          req.params.postID,

          { $push: { likes: userId } },
          { new: true, runValidators: true },
        )
        .populate({ path: 'likes', select: 'name surname image' })
      if (modifiedPost) {
        res.send(modifiedPost)
      }
    } else {
      next(createHttpError(400, `User already liked that post`))
    }
  } catch (error) {
    next(error)
  }
})

postsRouter.delete('/:postId/like', async (req, res, next) => {
  try {
    const { userId } = req.body
    const updatedPost = await posts
      .findByIdAndUpdate(
        req.params.postId,
        { $pull: { likes: userId } },
        { new: true },
      )
      .populate({ path: 'likes', select: 'name surname image' })
    if (updatedPost) {
      res.send(updatedPost)
    } else {
      next(createHttpError(404, `Post with id ${req.params.postId} not found`))
    }
  } catch (error) {
    next(error)
  }
})

export default postsRouter
