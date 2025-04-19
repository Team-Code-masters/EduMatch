import { Router } from "express";
import { googleOAuthCallback } from "../controllers/oauth.js";
import { googleOAuthMiddleware } from "../middlewares/oauth.js";

const oauthRouter = Router();
// Google OAuth routes
oauthRouter.get('/auth/google', googleOAuthMiddleware); // Start OAuth flow
oauthRouter.get('/auth/google/callback', googleOAuthCallback); // Handle the callback from Google


// oauthRouter.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// // Callback
// oauthRouter.get('/auth/facebook/callback', googleOAuthCallback); // Reuse same controller pattern, just change name

export default oauthRouter