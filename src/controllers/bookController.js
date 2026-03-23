import bookService from '../services/bookService.js';

class bookController {
  async searchBook(req, res) {
    try {
      const { title } = req.query;

      if (!title) {
        return res.status(400).json({ message: "Title must be provided for the search" });
      }

      const searchResult = await bookService.searchBook(title);
      return res.status(200).json({
        message: "Success",
        count: searchResult.length,
        books: searchResult
      });
    } catch (error) {
      console.error("Search Error:", error);
      return res.status(500).json({ message: "Failed to fetch books from Google" });
    }
  }

  async addBook(req, res) {
    try {
      const { googleId, status } = req.body;
      const userId = req.user.id;

      if (!googleId || !status) return res.status(400).json({ message: "GoogleId and Book status must be provided" });

      const validStatus = ['WANT_TO_READ', 'READING', 'COMPLETED'];
      if (!validStatus.includes(status)) return res.status(400).json({ message: "Invalid Reading Status provided" });

      const result = await bookService.addBook(googleId, status, userId);
      return res.status(201).json({
        message: "Success",
        book: result
      });
    } catch (error) {
      console.error("Book Add Error:", error);
      return res.status(500).json({ message: "Failed to add book from Google" });
    }
  }

  async getBooks(req, res) {
    const { status } = req.query;
    const { id } = req.user;

    const validStatus = ['WANT_TO_READ', 'READING', 'COMPLETED'];

    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ message: "Status must be valid or empty" });
    }

    try {
      const books = await bookService.getBooks(id, status);
      return res.status(200).json({
        message: "Success",
        book: books
      })
    } catch (error) {
      console.error("Book Retrieve Error:", error);
      return res.status(500).json({ message: "Failed to retrieve books" });
    }
  }

  async getBookById(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const bookId = parseInt(id);

      const bookMetadata = await bookService.getBookById(bookId, userId);

      if (!bookMetadata) {
        return res.status(404).json({ message: "No book found by that id on your shelf" });
      }

      return res.status(200).json({
        message: "Success",
        metadata: bookMetadata
      });

    } catch (error) {
      console.error("Fetch Detail Error:", error);
      return res.status(500).json({ message: "Failed to retrieve book details" });
    }
  }

  async updateBookStatus(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    const validStatus = ['WANT_TO_READ', 'READING', 'COMPLETED'];
    if (!status || !validStatus.includes(status)) {
      return res.status(400).json({ message: "Status is empty or invalid" });
    }

    try {
      const bookId = parseInt(id);
      const updatedUserBook = await bookService.updateBookStatus(userId, bookId, status);

      return res.status(200).json({
        message: "Status updated successfully",
        metadata: updatedUserBook
      });

    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "No book entry found to update on your shelf" });
      }

      console.error("Update Status Error:", error);
      return res.status(500).json({ message: "Failed to Update Status" });
    }
  }

  async deleteBook(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const bookId = parseInt(id);
      await bookService.deleteBook(userId, bookId);

      return res.sendStatus(204);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "No book entry found to delete" });
      }

      console.error("Delete Book Error:", error);
      return res.status(500).json({ message: "Failed to delete User book entry" });
    }
  }

  async updateReview(req, res) {
    const userId = req.user.id;
    const bookId = parseInt(req.params.id);
    const rating = parseInt(req.body.rating);
    const review = req.body.review || null;

    const lowest_possible_book_rating = 1;
    const highest_possible_book_rating = 5;

    if (isNaN(rating) || rating < lowest_possible_book_rating || rating > highest_possible_book_rating) {
      return res.status(400).json({ message: "Rating must be a number from 1 to 5" }); // 2. Fixed 'res' typo
    }

    try {
      const updatedUserBook = await bookService.updateReview(userId, bookId, rating, review);
      return res.status(200).json({
        message: "Review updated successfully",
        data: updatedUserBook
      });

    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: "Book not found on your shelf." });
      }
      console.error("Review log error: ", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getPace(req, res) {
    const userId = req.user.id;
    const bookId = parseInt(req.params.id);

    if (isNaN(bookId)) {
      return res.status(400).json({ message: "bookId must be a number" });
    }

    try {
      const pace = await bookService.getPace(userId, bookId);
      res.status(200).json({
        message: "Success",
        pace: pace,
        unit: "pages_per_hour"
      });
    } catch (error) {
      if (error.message.includes("No sessions found")) {
        return res.status(404).json({ message: error.message });
      }

      console.error("Pace Calculation Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default new bookController();
