const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      })
      .end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;