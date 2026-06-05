import axios from 'axios';
import { prisma } from '../prismaClient.js';
import sessionService from './sessionService.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class bookService {
  #createGoogleBooksError() {
    const error = new Error('Unable to fetch book data from Google Books');
    error.statusCode = 502;
    return error;
  }

  async searchBook(title) {
    const params = new URLSearchParams({
      q: `intitle:${title}`,
      maxResults: 10,
      fields: "items(id,volumeInfo(title,authors,publishedDate,imageLinks/thumbnail))",
      key: config.bookApiKey
    });

    const url = `https://www.googleapis.com/books/v1/volumes?${params}`;

    try {
      const response = await axios.get(url);
      const items = response.data?.items;

      if (!items) return [];

      return items.map(item => ({
        googleId: item.id,
        title: item.volumeInfo?.title || 'Unknown Title',
        author: item.volumeInfo?.authors?.[0] || 'Unknown Author',
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail || ''
      }));
    } catch (error) {
      logger.error('Google Books API search failed', {
        endpoint: '/volumes',
        error: error.message
      });
      throw this.#createGoogleBooksError();
    }
  }

  async addBook(googleId, status, userId) {
    let book = await prisma.book.findUnique({
      where: { googleId }
    });

    if (!book) {
      const params = new URLSearchParams({
        fields: "id,volumeInfo(title,authors,description,pageCount,categories,imageLinks/thumbnail)",
        key: config.bookApiKey
      });

      const url = `https://www.googleapis.com/books/v1/volumes/${googleId}?${params}`;
      let response;

      try {
        response = await axios.get(url);
      } catch (error) {
        logger.error('Google Books API fetch book failed', {
          googleId,
          error: error.message
        });
        throw this.#createGoogleBooksError();
      }

      const info = response.data?.volumeInfo;

      if (!response.data?.id || !info) {
        throw this.#createGoogleBooksError();
      }

      book = await prisma.book.create({
        data: {
          googleId: response.data.id,
          title: info.title || 'Unknown Title',
          author: info.authors?.[0] || "Unknown Author",
          thumbnail: info.imageLinks?.thumbnail || "",
          description: info.description || "",
          pageCount: info.pageCount || 0,
          category: info.categories?.[0] || "General"
        }
      });
    }

    const existingUserBook = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId: book.id } }
    });

    const needsStartDate = status === 'READING' && (!existingUserBook || !existingUserBook.startDate);

    const result = await prisma.userBook.upsert({
      where: {
        userId_bookId: { userId, bookId: book.id }
      },
      update: {
        status,
        startDate: needsStartDate ? new Date() : undefined
      },
      create: {
        userId,
        bookId: book.id,
        status,
        currentPage: 0,
        startDate: status === 'READING' ? new Date() : null,
      },
      include: {
        book: true
      }
    });

    logger.info('Book added to shelf', {
      userId,
      bookId: result.book.id,
      status: result.status
    });

    return result;
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
    const result = await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      },
      data: {
        status,
        endDate: status === 'COMPLETED' ? new Date() : null,
      }
    });

    logger.info('Book status updated', { userId, bookId, status });

    return result;
  }

  async deleteBook(userId, bookId) {
    const result = await prisma.userBook.delete({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });

    logger.info('Book removed from shelf', { userId, bookId });

    return result;
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

  async updateReview(userId, bookId, rating, review = null) {
    const result = await prisma.userBook.update({
      where: {
        userId_bookId: { userId, bookId }
      },
      data: {
        rating,
        review
      }
    });

    logger.info('Book review added', { userId, bookId, rating });

    return result;
  }

  async getPace(userId, bookId) {
    const sessions = await sessionService.getSessions(userId, bookId);

    if (!sessions || sessions.length === 0) {
      return 0;
    }

    const totalPages = sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    if (totalSeconds === 0) return 0;

    const pagesPerHour = (totalPages / totalSeconds) * 3600;

    return Math.round(pagesPerHour * 10) / 10;
  }
}

export default new bookService();
