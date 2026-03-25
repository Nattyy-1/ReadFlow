import express from 'express';
import sessionController from '../controllers/sessionController.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/start', asyncHandler(sessionController.startSession));
router.post('/stop', asyncHandler(sessionController.stopSession));
router.get('/book/:bookId', asyncHandler(sessionController.getSessionsForBook));
router.get('/', asyncHandler(sessionController.getAllSessions));

export default router;
