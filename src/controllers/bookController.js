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
}

export default new bookController();
