import Joi from "joi";

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().regex(/^\d+[smhd]$/).required(),
    REFRESH_TOKEN_EXPIRES_DAYS: Joi.number().integer().positive().required(),
    // Business settings (all optional, sensible defaults for Pakistan)
    TAX_RATE_PERCENT: Joi.number().min(0).max(50).default(15),
    RESTAURANT_TIMEZONE: Joi.string().default('Asia/Karachi'),
    RESERVATION_DEPOSIT_AMOUNT: Joi.number().min(0).default(0),
    ENFORCE_OPENING_HOURS: Joi.boolean().default(true),
    RESERVATION_FREE_CANCEL_HOURS: Joi.number().integer().min(0).default(2),
})