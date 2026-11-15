import mongoose from "mongoose";
import Avatar from "../models/Avatar.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import Counter from "../models/Counter.js";


const getNextAvatarNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "avatarNumber" },
    { $inc: { sequence: 1 } },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return counter.sequence;
};

export const uploadAvatars = async (req, res) => {
  const uploadedPublicIds = [];
  const createdAvatarIds = [];

  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one image.",
      });
    }

    const uploadedAvatars = [];

    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer);

      uploadedPublicIds.push(result.public_id);

     const avatarNumber = await getNextAvatarNumber();
     const avatar = await Avatar.create({
      avatarNumber,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      filename: file.originalname,
    });

      createdAvatarIds.push(avatar._id);
      uploadedAvatars.push(avatar);
    }

    return res.status(201).json({
      success: true,
      message: "Avatars uploaded successfully!",
      count: uploadedAvatars.length,
      avatars: uploadedAvatars,
    });

  } catch (error) {
    console.error("Avatar upload error:", error);

    // Remove MongoDB records created during this upload
    if (createdAvatarIds.length > 0) {
      try {
        await Avatar.deleteMany({
          _id: { $in: createdAvatarIds },
        });
      } catch (dbCleanupError) {
        console.error("MongoDB cleanup failed:", dbCleanupError.message);
      }
    }

    // Remove Cloudinary images uploaded during this upload
    for (const publicId of uploadedPublicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cleanupError) {
        console.error(
          `Cloudinary cleanup failed for ${publicId}:`,
          cleanupError.message
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Avatar upload failed.",
      error: error.message,
    });
  }
};


export const getAvatars = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;

    const [avatars, totalAvatars] = await Promise.all([
      Avatar.find({ isActive: true })
        .select("_id imageUrl filename")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Avatar.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalAvatars,
      totalPages: Math.ceil(totalAvatars / limit),
      avatars,
    });
  } catch (error) {
    console.error("Get avatars error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch avatars.",
    });
  }
};



export const getRandomAvatar = async (req, res) => {
  try {
    const [avatar] = await Avatar.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 1 } },
      {
        $project: {
          _id: 1,
          imageUrl: 1,
          filename: 1,
        },
      },
    ]);

    if (!avatar) {
      return res.status(404).json({
        success: false,
        message: "No active avatars available.",
      });
    }

    return res.status(200).json({
      success: true,
      avatar,
    });
  } catch (error) {
    console.error("Random avatar error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch random avatar.",
    });
  }
};

export const getAvatarByNumber = async (req, res) => {
  try {
    const avatarNumber = Number(req.params.number);

    if (
      !Number.isInteger(avatarNumber) ||
      avatarNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid avatar number.",
      });
    }

    const avatar = await Avatar.findOne({
      avatarNumber,
      isActive: true,
    }).select("avatarNumber imageUrl filename");

    if (!avatar) {
      return res.status(404).json({
        success: false,
        message: "Avatar not found.",
      });
    }

    return res.status(200).json({
      success: true,
      avatar,
    });

  } catch (error) {
    console.error("Get avatar by number error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch avatar.",
    });
  }
};


export const deleteAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the avatar in MongoDB
    const avatar = await Avatar.findById(id);

    if (!avatar) {
      return res.status(404).json({
        success: false,
        message: "Avatar not found.",
      });
    }

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(avatar.publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(500).json({
        success: false,
        message: "Failed to delete avatar from Cloudinary.",
      });
    }

    // Delete the avatar record from MongoDB
    await Avatar.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Avatar deleted successfully.",
    });
  } catch (error) {
    console.error("Delete avatar error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete avatar.",
    });
  }
};



