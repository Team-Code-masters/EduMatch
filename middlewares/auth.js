import { expressjwt } from "express-jwt";
import { UserModel} from "../models/user.js"




export const isAuthenticated = expressjwt({
    secret: process.env.JWT_SECRET_KEY,
    algorithms: ['HS256']
});


export const isAuthorized = (roles) => {
    return async (req,res,next) => {
        //Get the user by his id
        const user = await UserModel.findById(req.auth.id);
        //To check if the role includes the users role 
        if (roles?.includes(user.role)) {
            next();
        }else{
            res.status(403).json('Access Denied, invalid authorization!')
        }
    }
};

export const isAuthorizedForViewingProfile = (req, res, next) => {
    const userRole = req.auth.role;  // Get the role from the authenticated user
  
    if (userRole === 'student' || userRole === 'superadmin' || userRole === 'admin') {
      return next();  // Proceed if the user is a student or superadmin
    } else {
      return res.status(403).json({ error: 'You are not authorized to view this profile' });
    }
  };


//   export const isAuthorizedForConfirmingCancelling = (req, res, next) => {
//     const userRole = req.auth.role;  // Get the role from the authenticated user
  
//     if (userRole === 'teacher' || userRole === 'superadmin' || userRole === 'admin') {
//       return next();  // Proceed if the user is a student or superadmin
//     } else {
//       return res.status(403).json({ error: 'You are not authorized to view this profile' });
//     }
//   };

