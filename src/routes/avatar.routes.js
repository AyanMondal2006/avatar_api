import express from "express";
import {
  uploadAvatars,
  getAvatars,
  getRandomAvatar,
  getAvatarByNumber,
  deleteAvatar,
} from "../controllers/avatar.controller.js";

import upload from "../middleware/upload.middleware.js";
import requireAdmin from "../middleware/admin.middleware.js";

const router = express.Router();

// Get all active avatars
router.get("/", getAvatars);

// Get one random active avatar
router.get("/random", getRandomAvatar);
router.get("/number/:number", getAvatarByNumber);

// Admin-protected avatar upload
router.post(
  "/upload",
  requireAdmin,
  (req, res, next) => {
    upload.array("avatars", 20)(req, res, (error) => {
      if (error) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Each image must be 5 MB or smaller.",
          });
        }

        if (
          error.code === "LIMIT_FILE_COUNT" ||
          error.code === "LIMIT_UNEXPECTED_FILE"
        ) {
          return res.status(400).json({
            success: false,
            message: "You can upload a maximum of 20 images per request.",
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message || "Image upload error.",
        });
      }

      next();
    });
  },
  uploadAvatars
);

// Admin-protected avatar deletion
router.delete("/:id", requireAdmin, deleteAvatar);

export default router;