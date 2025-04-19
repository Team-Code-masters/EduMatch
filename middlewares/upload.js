import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";






cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


export const profilePictureUpload = multer({
    storage: new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'EduMatch/profile-pictures', 
            allowed_formats: ['jpg', 'jpeg', 'png'], // optional but recommended
            transformation: [{ width: 500, height: 500, crop: 'limit' }] // optional
        }

    })
});

export const completeProfileUpload = multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'EduMatch/documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'docx']
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
  }).fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'academicCert', maxCount: 1 },
    { name: 'teachingCert', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1},
    { name: 'resume', maxCount: 1}
  ]);


  // export const completeProfileUpload = multer({
  //   storage: new CloudinaryStorage({
  //     cloudinary,
  //     params: (req, file) => {
  //       const folder = file.fieldname === 'profilePicture'
  //         ? 'EduMatch/profile-pictures'
  //         : 'EduMatch/documents';
  
  //       return {
  //         folder,
  //         allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'docx'],
  //         transformation: file.fieldname === 'profilePicture'
  //           ? [{ width: 500, height: 500, crop: 'limit' }]
  //           : undefined,
  //       };
  //     }
  //   }),
  //   limits: { fileSize: 10 * 1024 * 1024 },
  // }).fields([
  //   { name: 'profilePicture', maxCount: 1 },
  //   { name: 'academicCert', maxCount: 1 },
  //   { name: 'teachingCert', maxCount: 1 },
  //   { name: 'idProof', maxCount: 1 },
  //   { name: 'resume', maxCount: 1 },
  //   { name: 'proofOfAddress', maxCount: 1 },
  // ]);
  