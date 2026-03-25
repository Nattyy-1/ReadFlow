import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.getMe));
router.post('/forgot-password', asyncHandler(authController.sendResetToken));
router.get('/verify-reset-token', asyncHandler(authController.verifyResetToken));
router.put('/reset-password', asyncHandler(authController.resetPassword));

export default router;
