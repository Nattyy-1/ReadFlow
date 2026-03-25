import express from 'express';
import bookController from '../controllers/bookController.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/search', asyncHandler(bookController.searchBook));
router.post('/add', asyncHandler(bookController.addBook));
router.get('/', asyncHandler(bookController.getBooks));
router.get('/:id', asyncHandler(bookController.getBookById));
router.patch('/:id', asyncHandler(bookController.updateBookStatus));
router.delete('/:id', asyncHandler(bookController.deleteBook));
router.patch('/:id/review', asyncHandler(bookController.updateReview));
router.get('/:id/pace', asyncHandler(bookController.getPace));

export default router;
