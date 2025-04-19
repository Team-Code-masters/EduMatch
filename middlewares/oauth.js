import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel } from '../models/user.js';
import jwt from 'jsonwebtoken';


// Middleware to handle Google OAuth
export const googleOAuthMiddleware = passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'  // 🔥 This is the key!
});


passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:4000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Try to find user by googleId or email
            const user = await UserModel.findOne({
                $or: [
                    { googleId: profile.id },
                    { email: profile.emails?.[0]?.value }
                ]
            });

            // 2. If user exists, just return them with a new JWT
            if (user) {
                const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
                    expiresIn: '24h',
                });
                return done(null, { user, token });
            }

            // 3. Generate a unique username
            const username = profile.displayName;
            const existingUsername = await UserModel.findOne({ username });
            if (existingUsername) {
                username ; // Append random digits
            }

            // 4. Create new user
            const newUser = new UserModel({
                googleId: profile.id,
                email: profile.emails?.[0]?.value,
                username,
                password: 'oauth-user-no-password',
            });

            await newUser.save();

            const token = jwt.sign(
                { id: newUser.id, role: newUser.role }, // Attach both ID and role
                process.env.JWT_SECRET_KEY, // Your secret key
                { expiresIn: '24h' }
            );

            return done(null, { user: newUser, token });

        } catch (err) {
            console.error('Google OAuth error:', err);
            return done(err);
        }
    }
));



// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: 'http://localhost:3050/auth/facebook/callback',
//     profileFields: ['id', 'displayName', 'emails'], // Include email
//   }, async (accessToken, refreshToken, profile, done) => {
//     try {
//       // 🔍 Check if the user already exists in your DB by Facebook ID
//       const existingUser = await UserModel.findOne({ facebookId: profile.id });

//       if (existingUser) {
//         const jwtToken = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET_KEY, {
//           expiresIn: '24h',
//         });

//         return done(null, { user: existingUser, token: jwtToken });
//       }

//       // 🆕 Create a new user if one doesn't exist
//       const newUser = new UserModel({
//         facebookId: profile.id,
//         email: profile.emails?.[0]?.value || `no-email-${profile.id}@facebook.com`, // Some FB accounts don't have email
//         username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
//         password: 'oauth-user-no-password-' + Math.random().toString(36).slice(2),
//       });

//       await newUser.save();

//       const jwtToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET_KEY, {
//         expiresIn: '24h',
//       });

//       return done(null, { user: newUser, token: jwtToken });
//     } catch (error) {
//       console.error('Facebook strategy error:', error);
//       return done(error, null);
//     }
//   }));

// // Middleware to handle Facebook OAuth
// export const facebookOAuthMiddleware = passport.authenticate('facebook', { scope: ['email'] });

export default passport;
