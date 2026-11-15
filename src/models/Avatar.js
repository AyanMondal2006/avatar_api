import mongoose from "mongoose";

const avatarSchema = new mongoose.Schema(
  {
    avatarNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
      unique: true,
    },

    filename: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Avatar = mongoose.model("Avatar", avatarSchema);

export default Avatar;