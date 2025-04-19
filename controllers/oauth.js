import passport from 'passport';




export const googleOAuthCallback = (req, res) => {
    passport.authenticate('google', { failureRedirect: '/auth/google/failure' }, (err, userData) => {
        if (err || !userData) {
            return res.status(400).json({ error: 'Authentication failed' });
        }

        const { user, token } = userData;

        return res.status(200).json({
            status: 'success',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                googleId: user.googleId
            },
        });
    })(req, res);  // Pass req and res, no need to pass next if it's not used
};


