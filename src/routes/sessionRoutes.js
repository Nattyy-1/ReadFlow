import express from 'express';
import sessionController from '../controllers/sessionController.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import * as sessionSchema from '../validations/session.schema.js';

const router = express.Router();

router.post('/start', validate(sessionSchema.startSessionSchema), asyncHandler(sessionController.startSession));
router.post('/stop', validate(sessionSchema.stopSessionSchema), asyncHandler(sessionController.stopSession));
router.get('/book/:bookId', validate(sessionSchema.getSessionsForBookSchema), asyncHandler(sessionController.getSessionsForBook));
router.get('/', asyncHandler(sessionController.getAllSessions));

export default router;
