import { Schema, model } from "mongoose";

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'student', enum: ['student', 'teacher', 'admin', 'superadmin'], required: true },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    passwordChangedAt: { type: Date },
    googleId: { type: String },
    fullName: { type: String },
    address: { type: String },
    profilePicture: { type: String },
    documents: {
        academicCert: { type: String },
        teachingCert: { type: String },
        idProof: { type: String },
        resume: { type: String },
        proofOfAddress: { type: String }
    },
    documentStatus: {
        academicCert: { type: Boolean, default: false }, // Verified status
        teachingCert: { type: Boolean, default: false },
        idProof: { type: Boolean, default: false },
        resume: { type: Boolean, default: false },
        proofOfAddress: { type: Boolean, default: false },
    },
    region: { type: String },
    subjects: {
        type: [String],
        required: true,
    },
    levels: {
        type: [String],
        enum: ['Primary School', 'Junior High School', 'Senior High School'],
        default: []
    },
    availability: [
        {
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            },
            from: { type: String, required: true }, // e.g. "09:00"
            to: { type: String, required: true }    // e.g. "12:00"
        }
    ],
    bio: { type: String },
    pricePerSession: { type: Number },
    currency: {
        type: String, enum: ['GH₵', 'USD', 'EUR', 'NGN'], // You can add more if needed
        default: 'GH₵'
    },
    languages: [{ type: [String], default: ['English'] }],
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },



}, {
    timestamps: true
});


userSchema.set("toJSON", {
    transform: (document, returned0bject) => {
        returned0bject.id = returned0bject._id.toString()
        delete returned0bject._id
        delete returned0bject.__v
    }
})


export const UserModel = model('User', userSchema);