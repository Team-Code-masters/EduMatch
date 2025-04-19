import express from "express";
import userRouter from "./routes/user.js";
import mongoose from "mongoose";
import session from "express-session";
import oauthRouter from "./routes/oauth.js";
import passport from "passport";
import bookingRouter from "./routes/booking.js";
import cors from 'cors';



await mongoose.connect(process.env.MONGO_URI);

const app = express();
app.use(cors({
    // origin: 'http://127.0.0.1:5500/index.html',
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Explicitly allow POST
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());



// // Optional: Only needed if you're using session-based auth
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false
//   }));

app.use(passport.initialize());
//   app.use(passport.session());

//Use routes
app.use(userRouter);
app.use(oauthRouter);
app.use(bookingRouter);



const port = process.env.PORT || 3050
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});