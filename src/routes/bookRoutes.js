import express from 'express';
import bookController from '../controllers/bookController.js';

const router = express.Router();

router.get('/search', bookController.searchBook);
router.post('/add', bookController.addBook);
router.get('/', bookController.getBooks);
router.get('/:id', bookController.getBookById);
router.patch('/:id', bookController.updateBookStatus);
router.delete('/:id', bookController.deleteBook);
router.patch('/:id/review', bookController.updateReview);
router.get('/:id/pace', bookController.getPace);

export default router;
