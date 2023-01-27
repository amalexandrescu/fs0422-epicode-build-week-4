import mongoose from 'mongoose'

const { Schema, model } = mongoose

const friendSchema = new Schema(
  {
    name: { type: String, required: true },
    name2: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

export default model('friends', friendSchema)
