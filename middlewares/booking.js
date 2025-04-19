import { UserModel } from "../models/user.js";
import { BookingModel } from "../models/booking.js";

export const checkTeacherAvailability = async (teacherId, days, timeFrom, timeTo) => {
    const teacher = await UserModel.findById(teacherId);

    if (!teacher || !teacher.availability || !Array.isArray(teacher.availability)) {
        return false;
    }

    // Go through each requested day and check if the teacher is available
    for (const requestedDay of days) {
        const availabilityForDay = teacher.availability.find(avail => avail.day === requestedDay);

        if (!availabilityForDay) continue;

        const startTime = availabilityForDay.from;
        const endTime = availabilityForDay.to;

        // Check if requested time falls within available time
        if (timeFrom >= startTime && timeTo <= endTime) {
            return true; // available at least one matching slot
        }
    }

    return false; // not available in any requested day/time
};



export const isSlotAvailable = async (teacherId, days, timeFrom, timeTo, currentBookingId = null) => {
    const conflict = await BookingModel.findOne({
        teacher: teacherId,
        day: { $in: days },
        $or: [
            {
                timeFrom: { $lt: timeTo },  // overlaps with time range
                timeTo: { $gt: timeFrom }
            }
        ],
        _id: { $ne: currentBookingId },  // exclude current booking ID from being checked
        status: { $in: ['pending', 'confirmed'] }
    });

    return !!conflict;  // Returns true if the slot is taken (conflict found)
};


