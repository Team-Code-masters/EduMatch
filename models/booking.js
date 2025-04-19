import { Schema } from "mongoose";
import mongoose from "mongoose";
import { model } from "mongoose";

const bookingSchema = new Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    teacherName: { String },
    teacherEmail: { String },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    studentName: { String },
    studentEmail: { String },
    date: { type: Date },
    day: { type: [String], enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
    duration: { type: String, enum: ['1month', '3months', '6months', '1year'], default: '1month', },
    timeFrom: { type: String, required: true },
    timeTo: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'rejected', 'awaiting_approval', 'canceled'], default: 'pending', },
    subjects: { type: [String], required: true, },
    notes: { type: String },
    style: { type: String, enum: ['casual', 'intensive', 'super-intensive'], default: 'casual', },
    meetingLink: { type: String, default: '' },
    sessionType: { type: String, enum: ['offline', 'online'], default: 'offline' },
    telephone: { type: String, default: '' },
    price: { type: Number },
    currency: {
        type: String, enum: ['GH₵', 'USD', 'EUR', 'NGN'],
        default: 'GH₵'
    },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },

}, {
    timestamps: true
});



bookingSchema.set("toJSON", {
    transform: (document, returned0bject) => {
        returned0bject.id = returned0bject._id.toString()
        delete returned0bject._id
        delete returned0bject.__v
    }
})




export const BookingModel = model('booking', bookingSchema)