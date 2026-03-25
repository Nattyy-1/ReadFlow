import bookService from '../services/bookService.js';

class bookController {
  async searchBook(req, res) {
    const { title } = req.query;

    if (!title || title.trim() === '') {
      const error = new Error("Title must be provided for the search");
      error.statusCode = 400;
      throw error;
    }

    const books = await bookService.searchBook(title);

    res.status(200).json({
      success: true,
      count: books.length,
      books
    });
  }

  async addBook(req, res) {
    const { googleId, status } = req.body;
    const userId = req.user.id;

    if (!googleId || !status) {
      const error = new Error("GoogleId and Book status must be provided");
      error.statusCode = 400;
      throw error;
    }

    const validStatus = ['WANT_TO_READ', 'READING', 'COMPLETED'];
    if (!validStatus.includes(status)) {
      const error = new Error("Invalid Reading Status provided");
      error.statusCode = 400;
      throw error;
    }

    const result = await bookService.addBook(googleId, status, userId);

    res.status(201).json({
      success: true,
      book: result
    });
  }

  async getBooks(req, res) {
    const { status } = req.query;
    const userId = req.user.id;

    const validStatus = ['WANT_TO_READ', 'READING', 'COMPLETED'];

    if (status && !validStatus.includes(status)) {
      const error = new Error("Status must be valid or empty");
      error.statusCode = 400;
      throw error;
    }

    const books = await bookService.getBooks(userId, status);

    res.status(200).json({
      success: true,
      books
    });
  }

  async getBookById(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    const bookId = parseInt(id);
    const bookMetadata = await bookService.getBookById(bookId, userId);

    if (!bookMetadata) {
      const error = new Error("No book found by that id on your shelf");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      metadata: bookMetadata
    });
  }

  async updateBookStatus(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    const validStatus = ['WANT_TO_READ', 'READING', 'COMPLETED'];
    if (!status || !validStatus.includes(status)) {
      const error = new Error("Status is empty or invalid");
      error.statusCode = 400;
      throw error;
    }

    const bookId = parseInt(id);
    const updatedUserBook = await bookService.updateBookStatus(userId, bookId, status);

    res.status(200).json({
      success: true,
      metadata: updatedUserBook
    });
  }

  async deleteBook(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    const bookId = parseInt(id);
    await bookService.deleteBook(userId, bookId);

    res.sendStatus(204);
  }

  async updateReview(req, res) {
    const userId = req.user.id;
    const bookId = parseInt(req.params.id);
    const rating = parseInt(req.body.rating);
    const review = req.body.review || null;

    const lowest_possible_book_rating = 1;
    const highest_possible_book_rating = 5;

    if (isNaN(rating) || rating < lowest_possible_book_rating || rating > highest_possible_book_rating) {
      const error = new Error("Rating must be a number from 1 to 5");
      error.statusCode = 400;
      throw error;
    }

    const updatedUserBook = await bookService.updateReview(userId, bookId, rating, review);

    res.status(200).json({
      success: true,
      data: updatedUserBook
    });
  }

  async getPace(req, res) {
    const userId = req.user.id;
    const bookId = parseInt(req.params.id);

    if (isNaN(bookId)) {
      const error = new Error("bookId must be a number");
      error.statusCode = 400;
      throw error;
    }

    const pace = await bookService.getPace(userId, bookId);

    res.status(200).json({
      success: true,
      pace: pace,
      unit: "pages_per_hour"
    });
  }
}

export default new bookController();
