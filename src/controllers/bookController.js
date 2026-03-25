import bookService from '../services/bookService.js';

class bookController {
  async searchBook(req, res) {
    const { title } = req.validData.query;

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

    const result = await bookService.addBook(googleId, status, userId);

    res.status(201).json({
      success: true,
      book: result
    });
  }

  async getBooks(req, res) {
    const { status } = req.validData.query;
    const userId = req.user.id;

    const books = await bookService.getBooks(userId, status);

    res.status(200).json({
      success: true,
      books
    });
  }

  async getBookById(req, res) {
    const { id: bookId } = req.validData.params;
    const userId = req.user.id;

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
    const { id: bookId } = req.validData.params;
    const userId = req.user.id;
    const { status } = req.body;

    const updatedUserBook = await bookService.updateBookStatus(userId, bookId, status);

    res.status(200).json({
      success: true,
      metadata: updatedUserBook
    });
  }

  async deleteBook(req, res) {
    const { id: bookId } = req.validData.params;
    const userId = req.user.id;

    await bookService.deleteBook(userId, bookId);

    res.sendStatus(204);
  }

  async updateReview(req, res) {
    const userId = req.user.id;
    const { id: bookId } = req.validData.params;
    const { rating, review = null } = req.body;

    const updatedUserBook = await bookService.updateReview(userId, bookId, rating, review);

    res.status(200).json({
      success: true,
      data: updatedUserBook
    });
  }

  async getPace(req, res) {
    const userId = req.user.id;
    const { id: bookId } = req.validData.params;

    const pace = await bookService.getPace(userId, bookId);

    res.status(200).json({
      success: true,
      pace: pace,
      unit: "pages_per_hour"
    });
  }
}

export default new bookController();
