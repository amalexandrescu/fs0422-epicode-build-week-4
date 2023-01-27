import mongoose from 'mongoose'

const { Schema, model } = mongoose

const commentsSchema = new Schema(
  {
    comment: { type: String },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true },
)

const postSchema = new Schema(
  {
    text: { type: String, required: true },
    username: { type: String, required: true },
    image: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    comments: [commentsSchema],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
)

export default model('posts', postSchema)
