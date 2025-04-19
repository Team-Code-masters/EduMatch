import { Router } from "express";
import { completeProfile, forgotPassword, getAuthenticatedUser, getTeacherProfile, loginUser, registerUser, resetPassword, searchTeachers, updateUser, verifyDocuments } from "../controllers/user.js";
import { isAuthenticated, isAuthorizedForViewingProfile, isAuthorized } from "../middlewares/auth.js";
import { completeProfileUpload, profilePictureUpload } from "../middlewares/upload.js";


//Create a users route
const userRouter = Router();

//Define all the routes for a user
userRouter.post('/api/users/register', registerUser);
userRouter.post('/api/users/login', loginUser);

userRouter.get('/api/users/me', isAuthenticated, getAuthenticatedUser);
userRouter.post('/api/users/forgot-password', forgotPassword)
userRouter.patch('/api/users/reset-password/:token', resetPassword)
userRouter.patch(
    '/api/users/complete-profile',
    isAuthenticated,
    // profilePictureUpload.single('profilePicture'),
    completeProfileUpload,
    completeProfile
);

userRouter.get('/api/users/teachers/search', isAuthenticated, searchTeachers);
userRouter.get('/api/users/teachers/:id', isAuthenticated, isAuthorizedForViewingProfile, getTeacherProfile);

userRouter.post('/api/verify-documents/:id', isAuthenticated, isAuthorized(['superadmin', 'admin']), verifyDocuments);
userRouter.patch('/api/users/:id', updateUser);

export default userRouter
