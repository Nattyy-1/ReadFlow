import express from 'express';
import sessionController from '../controllers/sessionController.js';

const router = express.Router();

router.post('/start', sessionController.startSession);
router.post('/stop', sessionController.stopSession);

export default router;
