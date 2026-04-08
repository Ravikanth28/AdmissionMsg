const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(filePath, options = {}) {
  const defaultOptions = {
    folder: 'admission-msg',
    resource_type: 'auto',
  };
  
  const result = await cloudinary.uploader.upload(filePath, {
    ...defaultOptions,
    ...options,
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
    resourceType: result.resource_type,
  };
}

async function deleteFromCloudinary(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
