import express, { response } from 'express'
import createHttpError from 'http-errors'
import friends from './model.js'

const friendsRouter = express.Router()

friendsRouter.get('/', (req, res, next) => {
  const friends = friends.find({})

  if (friends) {
    response.status(200).send({ message: 'Friends have been found' })
  }
})
