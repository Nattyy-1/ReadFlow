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
}

export default new bookController();
