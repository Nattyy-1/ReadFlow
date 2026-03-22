import express from 'express';
import sessionController from '../controllers/sessionController.js';

const router = express.Router();

router.post('/start', sessionController.startSession);
router.post('/stop', sessionController.stopSession);
router.get('/book/:bookId', sessionController.getSessionsForBook);
router.get('/', sessionController.getAllSessions);

export default router;
