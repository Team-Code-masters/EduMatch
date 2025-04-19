// Booking Controller Logic
import { BookingModel } from '../models/booking.js';
import { UserModel } from '../models/user.js';
import { checkTeacherAvailability, isSlotAvailable } from '../middlewares/booking.js';
import { sendEmail } from '../utils/mail.js'
import mongoose from 'mongoose';

export const bookSession = async (req, res) => {
    try {
        const studentId = req.auth.id; // from token
        const teacherId = req.params.teacherId;
        const {
            day, // Array of weekdays
            timeFrom,
            timeTo,
            duration = '1month',
            notes = '',
            style = 'casual',
            sessionType = 'offline',
        } = req.body;

        if (!teacherId || !day || !timeFrom || !timeTo) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        // ✅ 1. Fetch teacher & student details (REQUIRED)
        const [teacher, student] = await Promise.all([
            UserModel.findById(teacherId).select('fullName email verificationStatus'), // Only get needed fields
            UserModel.findById(studentId).select('fullName email'),
        ]);
        console.log("Fetched teacher:", teacher);
        // ✅ 2. Check if teacher is verified
        if (!teacher || teacher.verificationStatus !== 'approved') {
            return res.status(400).json({ message: 'Cannot create booking. Teacher is not verified yet.' });
        }

        // Check teacher availability
        const isAvailable = await checkTeacherAvailability(teacherId, day, timeFrom, timeTo);
        if (!isAvailable) {
            return res.status(400).json({ message: 'Teacher not available at this time.' });
        }

        // Check for existing booking conflict
        const currentBookingId = req.params.bookingId || null;
        const isConflict = await isSlotAvailable(teacherId, day, timeFrom, timeTo);
        if (isConflict) {
            return res.status(400).json({ message: 'Time slot already booked.' });
        }

        // Create and save booking
        const newBooking = new BookingModel({
            teacher: teacherId,
            teacherName: teacher.fullName, // Now available
            teacherEmail: teacher.email,
            student: studentId,
            studentName: student.fullName, // Now available
            studentEmail: student.email,
            day,
            timeFrom,
            timeTo,
            duration,
            notes,
            style,
            sessionType,
        });

        await newBooking.save();

        // Send email notification to teacher
        await sendEmail(
            teacher.email,
            'New Booking Request',
            `Hello ${teacher.fullName},\n\n` +
            `You have received a new booking request from ${student.fullName}:\n\n` +
            `Day(s): ${day.join(', ')}\n` +
            `Time: ${timeFrom} - ${timeTo}\n` +
            `Duration: ${duration}\n` +
            `Session Type: ${sessionType}\n\n` +
            `Please log in to your account to respond to this request.`
        );


        res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
        return;
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ message: 'Error creating booking' });
    }
};
// const { id: bookingId } = req.params;

export const confirmOrRejectBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const { status, telephone, meetingLink, price } = req.body;

        const booking = await BookingModel.findOne({ id: bookingId, teacher: req.auth.id });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized action.' });
        }

        if (!['confirmed', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Only "confirmed" or "rejected" are allowed.' });
        }

        // If teacher is confirming, set price and switch to awaiting student approval
        if (status === 'confirmed') {
            if (booking.sessionType === 'offline' && telephone) {
                booking.telephone = telephone;
            } else if (booking.sessionType === 'online' && meetingLink) {
                booking.meetingLink = meetingLink;
            }

            if (!price) {
                return res.status(400).json({ error: 'Price is required to confirm booking.' });
            }


            booking.price = price;
            booking.status = 'awaiting_approval';
        } else if (status === 'rejected') {
            booking.status = 'rejected';
        }

        await booking.save();


        res.status(200).json({ message: 'Booking updated successfully.', booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while updating the booking.' });
    }
};



export const cancelBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;

        // Find the booking and ensure the student is the one who created the booking
        const booking = await BookingModel.findOne({ _id: bookingId, student: req.auth.id });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized action.' });
        }

        // Check if the status allows cancellation (pending, confirmed, awaiting_approval)
        if (!['pending', 'confirmed', 'awaiting_approval'].includes(booking.status)) {
            return res.status(400).json({ error: 'Booking cannot be canceled, it is already completed or rejected.' });
        }

        // Set the status to canceled
        booking.status = 'canceled';

        await booking.save();


        res.status(200).json({
            message: 'Booking canceled successfully!',
            booking
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while canceling the booking.' });
    }
};


export const approveBooking = async (req, res) => {
    try {
        const { id: bookingId } = req.params;

        const booking = await BookingModel.findOne({ id: bookingId, student: req.auth.id });

        if (!booking || booking.status !== 'awaiting_approval') {
            return res.status(400).json({ error: 'Booking not found or not awaiting approval.' });
        }

        booking.status = 'confirmed';
        await booking.save();

        res.status(200).json({ message: 'Booking approved successfully.', booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while approving the booking.' });
    }
};


// Controller for fetching teacher's bookings
// Admin: Get all bookings for a teacher
export const getBookingsForTeacher = async (req, res) => {
    try {
        const teacherId = req.params.id;

        const bookings = await BookingModel.find({ teacher: teacherId })
            .populate('teacher', 'fullName email profilePicture')
            .populate('student', 'fullName email profilePicture');

        if (!bookings.length) {
            return res.status(404).json({ message: 'No bookings found for this teacher.' });
        }

        res.status(200).json({ bookings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to retrieve bookings for teacher.' });
    }
};


// Admin: Get all bookings for a student
export const getBookingsForStudent = async (req, res) => {
    try {
        const studentId = req.params.id;

        const bookings = await BookingModel.find({ student: studentId });

        if (!bookings.length) {
            return res.status(404).json({ message: 'No bookings found for this student.' });
        }

        res.status(200).json({ count: bookings.length, bookings });
    } catch (error) {
        console.error('Error fetching student bookings:', error);
        res.status(500).json({ error: 'Server error while fetching student bookings' });
    }
};


// Controller for getting a teacher's bookings 
export const getStudentBookings = async (req, res) => {
    try {
        const bookings = await BookingModel.find({ student: req.auth.id })
            .populate('teacher', 'fullName profilePicture subjects')
            .sort({ createdAt: -1 });
        res.status(200).json({ bookings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

export const getTeacherBookings = async (req, res) => {
    try {
        const bookings = await BookingModel.find({ teacher: req.auth.id })
            .populate('student', 'fullName profilePicture email')
            .sort({ createdAt: -1 });
        res.status(200).json({ bookings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};


export const rescheduleBooking = async (req, res) => {
    try {
        const studentId = req.auth.id; // from token
        const bookingId = req.params.bookingId;
        const {
            day, // new array of weekdays
            timeFrom,
            timeTo,
            duration,
            notes,
            subjects
        } = req.body;

        if (!day || !timeFrom || !timeTo) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // 1. Find the booking
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // 2. Ensure student owns this booking
        if (booking.student.toString() !== studentId) {
            return res.status(403).json({ message: 'You are not authorized to modify this booking.' });
        }

        // 3. Check teacher availability for new time
        const isAvailable = await checkTeacherAvailability(
            booking.teacher,
            day,
            timeFrom,
            timeTo
        );

        if (!isAvailable) {
            return res.status(400).json({ message: 'Teacher not available at this time.' });
        }

        // 4. Check for slot conflict
        const isConflict = await isSlotAvailable(
            booking.teacher,
            day,
            timeFrom,
            timeTo,
            booking.id // pass current booking ID to exclude from conflict
        );

        if (isConflict) {
            return res.status(400).json({ message: 'New time slot is already booked.' });
        }

        // 5. Update booking details
        booking.day = day;
        booking.timeFrom = timeFrom;
        booking.timeTo = timeTo;
        booking.status = 'pending'; // optional: reset status if teacher needs to reconfirm
        if (duration) booking.duration = duration;
        if (notes) booking.notes = notes;
        if (subjects) booking.subjects = subjects;

        await booking.save();

        return res.status(200).json({
            message: 'Booking rescheduled successfully.',
            booking,
        });

    } catch (err) {
        console.error('Error rescheduling booking:', err);
        return res.status(500).json({ message: 'Error rescheduling booking' });
    }
};

export const markBookingAsCompleted = async (req, res) => {
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.teacher.toString() !== req.auth.id) {
        return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }

    if (booking.status !== 'confirmed') {
        return res.status(400).json({ message: 'Only confirmed bookings can be marked as completed' });
    }

    booking.status = 'completed';
    await booking.save();

    res.json({ message: 'Booking marked as completed', booking });
};

export const leaveReview = async (req, res) => {
    const { bookingId } = req.params;
    const { rating, review } = req.body;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.student.toString() !== req.auth.id) {
        return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'You can only review completed sessions' });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    res.json({ message: 'Review submitted successfully', booking });
};


export const getFilteredBookings = async (req, res) => {
    const {
        status,
        sessionType,
        teacherName,
        studentName,
        startDate,
        endDate,
        subject
    } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (sessionType) filter.sessionType = sessionType;
    if (startDate && endDate) {
        filter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    // Populate for search by name
    const bookings = await BookingModel.find(filter)
        .populate('teacher', 'fullName email subjects')
        .populate('student', 'fullName email')
        .sort({ createdAt: -1 });

    // Filter by teacher or student name or subject if passed
    const filtered = bookings.filter(b => {
        const teacherMatch = teacherName
            ? b.teacher?.fullName?.toLowerCase().includes(teacherName.toLowerCase())
            : true;
        const studentMatch = studentName
            ? b.student?.fullName?.toLowerCase().includes(studentName.toLowerCase())
            : true;
        const subjectMatch = subject
            ? b.teacher?.subjects?.includes(subject)
            : true;
        return teacherMatch && studentMatch && subjectMatch;
    });

    res.json({ count: filtered.length, bookings: filtered });
};

export const getAllBookings = async (req, res) => {
    try {
        const bookings = await BookingModel.find()
            .populate('teacher', 'fullName email')
            .populate('student', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({ count: bookings.length, bookings });
    } catch (err) {
        console.error('Error fetching all bookings:', err);
        res.status(500).json({ message: 'Server error fetching bookings' });
    }
};




