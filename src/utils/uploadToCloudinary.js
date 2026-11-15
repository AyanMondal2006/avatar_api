
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const uploadToCloudinary = (fileBuffer, folder = "streamify/avatars") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export default uploadToCloudinary;
