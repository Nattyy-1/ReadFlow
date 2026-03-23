import axios from 'axios';
import { prisma } from '../prismaClient.js';
import sessionService from './sessionService.js';

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

  async addBook(googleId, status, userId) {
    let book = await prisma.book.findUnique({
      where: { googleId }
    });

    if (!book) {
      const params = new URLSearchParams({
        fields: "id,volumeInfo(title,authors,description,pageCount,categories,imageLinks/thumbnail)",
        key: process.env.GOOGLE_BOOKS_API_KEY
      });

      const url = `https://www.googleapis.com/books/v1/volumes/${googleId}?${params}`;
      const response = await axios.get(url);
      const info = response.data.volumeInfo;

      book = await prisma.book.create({
        data: {
          googleId: response.data.id,
          title: info.title,
          author: info.authors?.[0] || "Unknown Author",
          thumbnail: info.imageLinks?.thumbnail || "",
          description: info.description || "",
          pageCount: info.pageCount || 0,
          category: info.categories?.[0] || "General"
        }
      });
    }

    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: { userId, bookId: book.id }
      }
    });

    const needsStartDate = status === 'READING' && (!existingUserBook || !existingUserBook.startDate);

    return await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: userId,
          bookId: book.id
        }
      },
      update: {
        status,
        startDate: needsStartDate ? new Date() : undefined
      },
      create: {
        userId: userId,
        bookId: book.id,
        status: status,
        currentPage: 0,
        startDate: status === 'READING' ? new Date() : null,
      },
      include: {
        book: true
      }
    });
  }

  async getBooks(userId, status) {
    const filter = { userId };

    if (status) {
      filter.status = status;
    }

    const userBooks = await prisma.userBook.findMany({
      where: filter,
      select: {
        book: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return userBooks.map(entry => entry.book);
  }

  async getBookById(bookId, userId) {
    return await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });
  }

  async updateBookStatus(userId, bookId, status) {
    return await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      },
      data: {
        status,
        endDate: status === 'COMPLETED' ? new Date() : undefined,
      }
    });
  }

  async deleteBook(userId, bookId) {
    return await prisma.userBook.delete({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });
  }
  async resetBookProgress(userId, bookId) {
    return await prisma.userBook.update({
      where: {
        userId_bookId: { userId, bookId }
      },
      data: {
        currentPage: 0,
        endDate: null
      }
    });
  }

  async updatePage(userId, bookId, currentPage) {
    return await prisma.userBook.update({
      where: {
        userId_bookId: { userId, bookId }
      },
      data: {
        currentPage
      }
    });
  }

  async updateReview(userId, bookId, rating, review = null) {
    return await prisma.userBook.update({
      where: {
        userId_bookId: { userId, bookId }
      },
      data: {
        rating,
        review
      }
    });
  }

  async getPace(userId, bookId) {
    const sessions = await sessionService.getSessions(userId, bookId);

    if (!sessions || sessions.length === 0) {
      throw new Error("No sessions found for this book");
    }

    const totalPages = sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    if (totalSeconds === 0) return 0;

    const pagesPerHour = (totalPages / totalSeconds) * 3600;

    return Math.round(pagesPerHour * 10) / 10;
  }
}

export default new bookService();
