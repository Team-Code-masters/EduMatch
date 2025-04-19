import { UserModel } from "../models/user.js";
import { completeProfileValidator, forgotPasswordValidator, loginUserValidator, registerUserValidator, resetPasswordValidator, updateUserValidator } from "../validators/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mailTransporter, registerUserMailTemplate } from "../utils/mail.js";
import crypto from "crypto";





//Register a new user
export const registerUser = async (req, res, next) => {
    //validate the users information
    const { error, value } = registerUserValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    };
    //Check if the user doesnt have an account already
    const user = await UserModel.findOne({
        $or: [{ username: value.username }, { email: value.emal }]
    });
    if (user) {
        return res.status(409).json('User already exists!');
    };
    // Check if the role is valid (only 'teacher' or 'student' allowed)
    if (!['teacher', 'student'].includes(value.role)) {
        return res.status(400).json({ error: 'Invalid role. Please select either "teacher" or "student".' });
    }
    //Hash paintext password
    const hashedPassword = bcrypt.hashSync(value.password, 10);
    //Create a new user in the database
    const newUser = await UserModel.create({
        ...value,
        password: hashedPassword,
    });
    //Send registration email to user
    await mailTransporter.sendMail({
        from: "inusahomar98@gmail.com",
        to: value.email,
        subject: "Welcome to Natours",
        // text: `Dear ${value.username},\nA new account has been created for you\nThank you!`,
        html: registerUserMailTemplate.replace('{{username}}', value.username)
    });
    //(optional) Generate access token for user
    const token = jwt.sign(
        { id: newUser.id, role: newUser.role }, // Attach both ID and role
        process.env.JWT_SECRET_KEY, // Your secret key
        { expiresIn: '24h' }
    );
    // Return response
    res.status(201).json({
        status: 'success',
        message: 'User registered successfully! Please complete your profile.',
        token, // JWT token
    });
};

//Log a user into the app
export const loginUser = async (req, res, next) => {
    // console.log('Login route hit:', email, password);
    //validate the users information
    const { error, value } = loginUserValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    };
    //Find matching credentials in your database
    const user = await UserModel.findOne({
        $or: [{ username: value.username }, { email: value.email }]
    })
    if (!user) {
        return res.status(404).json('User does not exist')
    }
    const correctPassword = bcrypt.compareSync(value.password, user.password)
    if (!correctPassword) {
        res.status(401).json('Invalid credentials')
    }
    //Generate an access token for the user
    const token = jwt.sign(
        { id: user.id, role: user.role }, // Attach both ID and role
        process.env.JWT_SECRET_KEY, // Your secret key
        { expiresIn: '24h' }
    );
    //Return a response
    res.status(200).json({
        token,
        user: {
            role: user.role,
            email: user.email,
            username: user.username,
            id: user.id
        },
    });
};

export const updateUser = async (req, res, next) => {
    //Validate request body
    const { error, value } = updateUserValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    }
    //Update user in the database
    const result = await UserModel.findByIdAndUpdate(req.params.id, value, {
        new: true,
    });
    //Return response
    res.status(200).json(result);
};




export const getAuthenticatedUser = async (req, res, next) => {
    try {
        // Get user by id using req.auth.id
        const user = await UserModel.findById(req.auth.id).select({
            password: false, // Exclude password field from response
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check the user's role and return role-specific data
        if (user.role === 'teacher') {
            // For teachers: Return teacher-specific data (e.g., subjects, availability, etc.)
            const teacherDashboard = {
                fullName: user.fullName,
                profilePicture: user.profilePicture,
                subjects: user.subjects,
                availability: user.availability,
                bio: user.bio,
                region: user.region,
            };
            return res.status(200).json({ teacherDashboard });
        }

        if (user.role === 'student') {
            // For students: Return student-specific data (e.g., levels, bio, etc.)
            const studentDashboard = {
                fullName: user.fullName,
                profilePicture: user.profilePicture,
                levels: user.levels,
                bio: user.bio,
                region: user.region,
            };
            return res.status(200).json({ studentDashboard });
        }

        if (user.role === 'admin' || user.role === 'superadmin') {
            // For admin/superadmin: Return admin-specific data (e.g., users list, roles, etc.)
            const adminDashboard = {
                fullName: user.fullName,
                profilePicture: user.profilePicture,
                role: user.role,
                email: user.email,
            };
            return res.status(200).json({ adminDashboard });
        }

        // If the role is unknown, send an error
        return res.status(403).json({ error: 'Access Denied' });

    } catch (error) {
        next(error);
    }
};

//Forgot Password
export const forgotPassword = async (req, res, next) => {
    // Validate the user's input
    const { error, value } = forgotPasswordValidator.validate(req.body);
    if (error) return res.status(422).json(error);

    // Check if user exists
    const user = await UserModel.findOne({ email: value.email });
    if (!user) return res.status(404).json('User does not exist');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save();

    // Create reset link
    const frontendURL = process.env.FRONTEND_URL;
    const resetLink = `https://${frontendURL}/reset-password/${resetToken}`;

    try {
        // Send email
        await mailTransporter.sendMail({
            to: user.email,
            subject: 'Password Reset',
            html: `
          <p>You requested a password reset.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 30 minutes.</p>
        `,
        });

        // Send success response
        res.status(200).json({
            status: 'success',
            message: 'Password reset link sent to email',
            expiresAt: user.passwordResetExpires,
            token: resetToken
        });

    } catch (err) {
        // If email fails, clean up reset fields
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(500).json({ error: 'Failed to send reset email', details: err.message });
    }
};



export const resetPassword = async (req, res) => {
    //validate the users information
    const { error, value } = resetPasswordValidator.validate(req.body);
    if (error) {
        return res.status(422).json(error);
    };
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },

    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });
    // Hash the new password
    const hashedResetPassword = bcrypt.hashSync(value.password, 10);
    user.password = hashedResetPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ status: 'success' });
};



export const completeProfile = async (req, res) => {
    try {
        // console.log("User ID from request:", req.auth.id);

        // 1. Extract basic fields
        const {
            fullName,
            address,
            region,
            bio,
            role,
            languages,
            pricePerSession,
            currency,
            email,
        } = req.body;

        // 2. Parse JSON fields safely
        let parsedSubjects = [];
        let parsedLevels = [];
        let parsedAvailability = [];
        let parsedLanguages = [];

        try {
            parsedSubjects = req.body.subjects ? JSON.parse(req.body.subjects) : [];
            parsedLevels = req.body.levels ? JSON.parse(req.body.levels) : [];
            parsedAvailability = req.body.availability ? JSON.parse(req.body.availability) : [];
            parsedLanguages = req.body.languages ? JSON.parse(req.body.languages) : [];
        } catch (parseErr) {
            return res.status(400).json({
                error: 'Error parsing JSON fields',
                details: parseErr.message
            });
        }


        // 3. Handle file uploads - PROPERLY SEPARATED NOW
        const uploadedDocuments = {};
        let profilePictureUrl = null;
        if (req.files) {
            if (req.files['profilePicture'] && req.files['profilePicture'][0]) {
                profilePictureUrl = req.files['profilePicture'][0].path;
            }

            // Handle all other files as documents
            Object.entries(req.files).forEach(([fieldName, fileArray]) => {
                // Skip profile picture since we handled it separately
                if (fieldName !== 'profilePicture') {
                    uploadedDocuments[fieldName] = fileArray[0].path;
                }
            });
        }

        // 4. Build complete data object
        const completeData = {
            ...req.body,
            subjects: parsedSubjects,
            levels: parsedLevels,
            availability: parsedAvailability,
            languages: parsedLanguages,
            documents: uploadedDocuments, // Doesn't include profile picture
            profilePicture: profilePictureUrl, // Separate field
            pricePerSession: role === 'teacher' ? pricePerSession : undefined,
            currency: role === 'teacher' ? currency : undefined
        };

        // 5. Validate complete data
        const { error } = completeProfileValidator.validate(completeData);
        if (error) {
            return res.status(422).json({
                error: error.details[0].message,
                field: error.details[0].path[0]
            });
        }

        // 6. Update user profile
        const user = await UserModel.findById(req.auth.id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update role if needed
        if (!user.role || (role && user.role !== role)) {
            if (['student', 'teacher', 'admin'].includes(role)) {
                user.role = role;
            }
        }

        // Role-specific updates
        if (user.role === 'teacher') {
            user.subjects = parsedSubjects;
            user.availability = parsedAvailability;
            user.pricePerSession = pricePerSession;
            user.currency = currency;
        }

        // Update common fields
        user.fullName = fullName || user.fullName;
        user.address = address || user.address;
        user.region = region || user.region;
        user.bio = bio || user.bio;
        user.languages = parsedLanguages;
        user.levels = parsedLevels;

        // Handle profile picture separately
        if (profilePictureUrl) {
            user.profilePicture = profilePictureUrl;
        }

        // Update documents (excluding profile picture)
        if (Object.keys(uploadedDocuments).length > 0) {
            user.documents = user.documents || {};
            user.documents = {
                ...user.documents,
                ...uploadedDocuments
            };
        }

        await user.save();

        return res.status(200).json({
            message: `${user.role} profile updated successfully.`,
            user: {
                id: user.id,
                role: user.role,
                profilePicture: user.profilePicture, // Now properly separated
                // Include other fields as needed
            }
        });

    } catch (err) {
        console.error('Profile completion error:', err);
        return res.status(500).json({
            error: 'An error occurred while completing profile',
            message: err.message,
        });
    }
};


export const searchTeachers = async (req, res) => {
    try {
        const { subjects, levels, region, day, sortBy } = req.query;

        const filter = { role: 'teacher' };

        if (subjects) {
            const subjectsArray = Array.isArray(subjects) ? subjects : [subjects];
            filter.subjects = { $in: subjectsArray };
        }

        if (levels) {
            const levelsArray = Array.isArray(levels) ? levels : [levels];
            filter.levels = { $in: levelsArray };
        }

        if (region) {
            filter.region = region;
        }

        if (day) {
            filter.availability = {
                $elemMatch: { day }
            };
        }

        // Set sorting logic (optional)
        let sortOption = {};
        if (sortBy) {
            // Default sort ascending (A-Z)
            sortOption[sortBy] = 1;
        }

        const teachers = await UserModel.find(filter)
            .sort(sortOption)
            .select('-password');

        res.status(200).json({ count: teachers.length, teachers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error searching for teachers' });
    }
};

export const getTeacherProfile = async (req, res) => {
    const teacherId = req.params.id;  // Get teacher's ID from the URL params

    try {
        // Find the teacher by ID
        const teacher = await UserModel.findById(teacherId)
            .select('fullName profilePicture subjects levels availability bio');  // Select relevant fields

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Respond with teacher's profile details
        res.status(200).json({ teacher });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching teacher profile' });
    }
};

export const getStudentBookings = async (req, res) => {
    try {
        const studentId = req.auth.id;  // Assuming you use JWT and the student ID is in the auth token
        // Find bookings where the student is involved
        const bookings = await BookingModel.find({ student: studentId })
            .populate('teacher', 'fullName profilePicture region subjects levels')  // Populate only relevant teacher info
            .select('teacher student date timeFrom timeTo sessionType price status notes meetingLink style'); // Select the booking details to return

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'No bookings found for this student' });
        }

        res.status(200).json({ count: bookings.length, bookings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching student bookings' });
    }
};


export const verifyDocuments = async (req, res, next) => {
    const userId = req.params.id;
    const { document, isVerified } = req.body;

    // 1. List of valid document types from your schema
    const validDocumentTypes = [
        'academicCert',
        'teachingCert',
        'idProof',
        'resume',
        'proofOfAddress'
    ];

    // 2. Validate document type
    if (!validDocumentTypes.includes(document)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid document type provided',
            receivedDocument: document,
            validDocumentTypes: validDocumentTypes,
            suggestion: 'Please provide one of the listed document types'
        });
    }

    try {
        // 3. Find the user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // 4. Check if document exists in user's documents
        if (!user.documents || !user.documents[document]) {
            return res.status(400).json({
                status: 'fail',
                message: 'Document not uploaded yet',
                document: document,
                uploadedDocuments: Object.keys(user.documents).filter(d => user.documents[d])
            });
        }

        // 5. Update verification status
        user.documentStatus[document] = isVerified;

        // 6. Check if all required documents are verified
        const allRequiredVerified = validDocumentTypes.every(doc => {
            // Only check documents that exist and are required
            return !user.documents[doc] || user.documentStatus[doc] === true;
        });

        if (allRequiredVerified) {
            user.isApproved = true;
            user.verificationStatus = 'approved';
        }

        await user.save();

        res.status(200).json({
            status: 'success',
            message: `Document verification status updated`,
            data: {
                document: document,
                isVerified: isVerified,
                documentStatus: user.documentStatus,
                isApproved: user.isApproved,
                verificationStatus: user.verificationStatus
            }
        });

    } catch (err) {
        console.error('Document verification error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while verifying document',
            error: err.message
        });
    }
};