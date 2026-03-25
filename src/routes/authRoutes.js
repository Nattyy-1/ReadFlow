import express from 'express';
import authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import * as authSchemas from '../validations/auth.schema.js';

const router = express.Router();

router.post('/register', validate(authSchemas.registerSchema), asyncHandler(authController.register));
router.post('/login', validate(authSchemas.loginSchema), asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.getMe));
router.post('/forgot-password', validate(authSchemas.forgotPasswordSchema), asyncHandler(authController.sendResetToken));
router.post('/verify-reset-token', validate(authSchemas.verifyResetTokenSchema), asyncHandler(authController.verifyResetToken));
router.put('/reset-password', validate(authSchemas.resetPasswordSchema), asyncHandler(authController.resetPassword));

export default router;
