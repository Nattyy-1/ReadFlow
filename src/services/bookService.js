import axios from 'axios';

class bookService {
  async searchBook(title) {

    const params = new URLSearchParams({
      q: `intitle:${title}`,
      maxResults: 10,
      fields: "items(id,volumeInfo(title,authors,publishedDate,imageLinks/thumbnail))",
      key: process.env.GOOGLE_BOOKS_API_KEY
    });

    const url = `https://www.googleapis.com/books/v1/volumes?${params}`;

    try {
      const response = await axios.get(url);

      if (!response.data.items) return [];
      const bookList = response.data.items.map(item => ({
        googleId: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.[0] || 'Unknown Author',
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || ''
      }));

      return bookList;
    } catch (err) {
      throw err;
    }
  }
}

export default new bookService();
