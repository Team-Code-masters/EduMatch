import Joi from "joi";


export const registerUserValidator = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().required(),
    role: Joi.string().optional(),
    password: Joi.string().required(),
    confirmPassword: Joi.ref('password'),
}).with('password', 'confirmPassword')


export const loginUserValidator = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
});

export const updateUserValidator = Joi.object({
    role: Joi.string().valid('admin', 'superadmin').optional(),

});

export const forgotPasswordValidator = Joi.object({
    email: Joi.string().required(),
})

export const resetPasswordValidator = Joi.object({
    password: Joi.string().required(),
    confirmPassword: Joi.ref('password'),
}).with('password', 'confirmPassword')


export const completeProfileValidator = Joi.object({
    fullName: Joi.string().required(),
    address: Joi.string().required(),
    role: Joi.string().valid('teacher', 'student').optional(),
    region: Joi.string().required(),
    // Only validate 'subjects' and 'availability' for teachers
    subjects: Joi.array().items(Joi.string().min(3)).required() // each subject should be at least 3 characters long
        .min(1) // at least one subject must be provided
        .when('role', { is: 'teacher', then: Joi.required() }),

    availability: Joi.array().items(
        Joi.object({
            day: Joi.string()
                .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
                .required(),
            from: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required(), // e.g., 09:00
            to: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()  // e.g., 12:00
        })
    ).min(1).when('role', { is: 'teacher', then: Joi.required() }),

    // Only validate 'levels' for students
    levels: Joi.array().items(Joi.string().valid('Primary School', 'Junior High School', 'Senior High School'))
        .min(1)
        .when('role', { is: 'student', then: Joi.required() }),
    bio: Joi.string().required(),
    profilePicture: Joi.string().uri().required(),
    documents: Joi.object({
        academicCert: Joi.string().uri().required(),
        teachingCert: Joi.string().uri().required(),
        idProof: Joi.string().uri().required(),
        resume: Joi.string().uri().required(),
        proofOfAddress: Joi.string().uri().required()
    }),
    languages: Joi.array().items(Joi.string()).required(),
    pricePerSession: Joi.string().when('role', {
        is: 'teacher',
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),
    currency: Joi.string().valid('GH₵', 'USD', 'EUR', 'NGN').when('role', {
        is: 'teacher',
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),

    // These are strictly admin/superadmin fields
    isVerified: Joi.forbidden(),
    verificationStatus: Joi.forbidden(),





})