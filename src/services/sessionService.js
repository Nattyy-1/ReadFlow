import { prisma } from '../prismaClient.js';
import bookService from './bookService.js';
import logger from '../utils/logger.js';

class sessionService {
  async startSession(userId, bookId) {
    const activeSession = await prisma.readingSession.findFirst({
      where: {
        userBook: { userId: userId },
        endTime: null
      },
      include: {
        userBook: {
          include: { book: true }
        }
      }
    });

    if (activeSession) {
      throw new Error(`ACTIVE_SESSION_EXISTS:${activeSession.userBook.book.title}`);
    }

    const userBook = await bookService.getBookById(bookId, userId);

    if (!userBook) {
      throw new Error("P2025");
    }

    if (userBook.status !== 'READING') {
      if (userBook.status === 'COMPLETED') {
        await bookService.resetBookProgress(userId, bookId);
      }
      await bookService.updateBookStatus(userId, bookId, 'READING');
    }

    const session = await prisma.readingSession.create({
      data: {
        startTime: new Date(),
        userBookId: userBook.id
      }
    });

    logger.info('Reading session started', { userId, bookId, sessionId: session.id });

    return session;
  }

  async endSession(userId, sessionId, currentPage) {
    const activeSession = await prisma.readingSession.findFirst({
      where: {
        id: sessionId,
        userBook: {
          userId
        }
      },
      include: {
        userBook: {
          include: { book: true }
        }
      }
    });

    if (!activeSession || activeSession.endTime !== null) {
      const error = new Error("No open session found by this ID");
      error.statusCode = 404;
      throw error;
    }

    const previousPage = activeSession.userBook.currentPage;
    const totalPageCount = activeSession.userBook.book.pageCount;
    const bookId = activeSession.userBook.bookId;

    if (currentPage < previousPage) {
      const error = new Error("Current page cannot be less than the previous recorded page");
      error.statusCode = 400;
      throw error;
    }

    if (currentPage > totalPageCount) {
      const error = new Error("Current page cannot exceed the book's total page count");
      error.statusCode = 400;
      throw error;
    }

    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime - activeSession.startTime) / 1000);
    const pagesReadDuringSession = currentPage - previousPage;

    const [updatedSession] = await prisma.$transaction([
      prisma.readingSession.update({
        where: { id: sessionId },
        data: {
          endTime: endTime,
          pagesRead: pagesReadDuringSession,
          duration: durationInSeconds
        }
      }),
      prisma.userBook.update({
        where: { userId_bookId: { userId, bookId } },
        data: { currentPage }
      })
    ]);

    if (currentPage === totalPageCount) {
      await bookService.updateBookStatus(userId, bookId, 'COMPLETED');
      updatedSession.bookStatus = 'COMPLETED';
      logger.info('Book completed', { userId, bookId });
    }

    logger.info('Reading session ended', {
      userId,
      bookId,
      sessionId,
      pagesRead: pagesReadDuringSession,
      duration: durationInSeconds
    });

    return updatedSession;
  }

  async getSessions(userId, bookId = null) {
    return await prisma.readingSession.findMany({
      where: {
        userBook: {
          userId: userId,
          ...(bookId && { bookId: bookId })
        }
      },
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        startTime: true,
        pagesRead: true,
        duration: true,
        userBook: {
          select: {
            book: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });
  }
}

export default new sessionService();
