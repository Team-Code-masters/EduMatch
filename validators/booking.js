import Joi from "joi";


export const createBookingValidator = Joi.object({
    teacher: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .message('Teacher ID must be a valid MongoDB ObjectId'),

    day: Joi.array()
        .items(Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
        .min(1)
        .required(),

    duration: Joi.string()
        .valid('1month', '3months', '6months', '1year')
        .default('1month'),

    timeFrom: Joi.string()
        .required()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/) // Validates HH:mm format (24hr)
        .message('timeFrom must be in HH:mm format'),

    timeTo: Joi.string()
        .required()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .message('timeTo must be in HH:mm format'),

    notes: Joi.string().allow(''),

    style: Joi.string()
        .valid('casual', 'intensive', 'super-intensive')
        .default('casual'),

    sessionType: Joi.string()
        .valid('offline', 'online')
        .default('offline'),

    telephone: Joi.string()
        .allow('')
        .when('sessionType', {
            is: 'offline',
            then: Joi.string().min(7).required().messages({
                'string.base': 'Telephone must be a string',
                'string.empty': 'Telephone is required for offline sessions',
                'any.required': 'Telephone is required for offline sessions',
            }),
            otherwise: Joi.optional(),
        }),

    price: Joi.number().min(0).optional(),

    currency: Joi.string()
        .valid('GH₵', 'USD', 'EUR', 'NGN')
        .default('GH₵'),

    subjects: Joi.array().items(Joi.string().min(3)).required(),
});
