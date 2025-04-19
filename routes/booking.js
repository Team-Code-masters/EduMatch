import { Router } from "express";
import { isAuthenticated, isAuthorized, } from "../middlewares/auth.js";
import { approveBooking, bookSession, cancelBooking, confirmOrRejectBooking, getAllBookings, getBookingsForStudent, getBookingsForTeacher, getFilteredBookings, getStudentBookings, getTeacherBookings, leaveReview, markBookingAsCompleted, rescheduleBooking, } from "../controllers/booking.js";

//Create a users route
const bookingRouter = Router();

bookingRouter.post('/api/teachers/:teacherId/book', isAuthenticated, isAuthorized(['student']), bookSession);
bookingRouter.patch('/api/booking/:bookingId/confirm-reject', isAuthenticated, isAuthorized(['teacher']), confirmOrRejectBooking);
bookingRouter.patch('/api/booking/:bookingId/approve', isAuthenticated, isAuthorized(['student']), approveBooking);
bookingRouter.patch('/api/booking/:bookingId/cancel', isAuthenticated, isAuthorized(['student', 'teacher']), cancelBooking);
// Get bookings by teacher ID
bookingRouter.get('/api/admin/booking/teacher/:teacherId', isAuthenticated, isAuthorized(['admin', 'superadmin']), getBookingsForTeacher);

// Get bookings by student ID
bookingRouter.get('/api/admin/booking/student/:studentId', isAuthenticated, isAuthorized(['admin', 'superadmin']), getBookingsForStudent);


bookingRouter.get('/api/booking/me', isAuthenticated, getStudentBookings);
bookingRouter.get('/api/booking/mine', isAuthenticated, getTeacherBookings);
bookingRouter.patch('/api/booking/:bookingId/reschedule', isAuthenticated, rescheduleBooking);

bookingRouter.patch('/api/booking/:bookingId/review', isAuthenticated, isAuthorized(['student']), leaveReview);

bookingRouter.patch('/api/booking/:bookingId/complete', isAuthenticated, isAuthorized(['teacher']), markBookingAsCompleted);

bookingRouter.get('/api/booking/admin', isAuthenticated, isAuthorized(['admin', 'superadmin']), getFilteredBookings);

bookingRouter.get('/api/booking/all', isAuthenticated, isAuthorized(['admin', 'superadmin']), getAllBookings);







export default bookingRouter;