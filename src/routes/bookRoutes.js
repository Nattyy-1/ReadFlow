import express from 'express';
import bookController from '../controllers/bookController.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import * as bookSchema from '../validations/book.schema.js';

const router = express.Router();

router.get('/search', validate(bookSchema.searchBookSchema), asyncHandler(bookController.searchBook));
router.post('/add', validate(bookSchema.addBookSchema), asyncHandler(bookController.addBook));
router.get('/', validate(bookSchema.getBooksSchema), asyncHandler(bookController.getBooks));
router.get('/:id', validate(bookSchema.getBookByIdSchema), asyncHandler(bookController.getBookById));
router.patch('/:id', validate(bookSchema.updateBookStatusSchema), asyncHandler(bookController.updateBookStatus));
router.delete('/:id', validate(bookSchema.deleteBookSchema), asyncHandler(bookController.deleteBook));
router.patch('/:id/review', validate(bookSchema.updateReviewSchema), asyncHandler(bookController.updateReview));
router.get('/:id/pace', validate(bookSchema.getPaceSchema), asyncHandler(bookController.getPace));

export default router;
