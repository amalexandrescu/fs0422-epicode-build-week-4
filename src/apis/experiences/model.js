import mongoose from "mongoose";

const { Schema, model } = mongoose;

const experienceSchema = new Schema(
  {
    role: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String },
    area: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

export default model("Experience", experienceSchema);
