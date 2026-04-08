import express from 'express';
import authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import * as authSchemas from '../validations/auth.schema.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', strictLimiter, validate(authSchemas.registerSchema), asyncHandler(authController.register));
router.post('/login', strictLimiter, validate(authSchemas.loginSchema), asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.getMe));
router.post('/forgot-password', strictLimiter, validate(authSchemas.forgotPasswordSchema), asyncHandler(authController.sendResetToken));
router.post('/verify-reset-token', validate(authSchemas.verifyResetTokenSchema), asyncHandler(authController.verifyResetToken));
router.put('/reset-password', strictLimiter, validate(authSchemas.resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post('/google', strictLimiter, validate(authSchemas.googleLoginSchema), asyncHandler(authController.googleLogin));
router.put('/update-profile', authMiddleware, strictLimiter, validate(authSchemas.updateProfileSchema), asyncHandler(authController.updateProfile));

export default router;
