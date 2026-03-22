import { prisma } from '../prismaClient.js';
import bookService from './bookService.js';

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

    return await prisma.readingSession.create({
      data: {
        startTime: new Date(),
        userBookId: userBook.id
      }
    });
  }

  async endSession(sessionId, currentPage) {
    const activeSession = await prisma.readingSession.findUnique({
      where: { id: sessionId },
      include: {
        userBook: {
          include: { book: true }
        }
      }
    });

    if (!activeSession || activeSession.endTime !== null) {
      throw new Error("No open session found by this ID");
    }

    const previousPage = activeSession.userBook.currentPage;
    const totalPageCount = activeSession.userBook.book.pageCount;
    const userId = activeSession.userBook.userId;
    const bookId = activeSession.userBook.bookId;

    if (currentPage < previousPage) {
      throw new Error("Current page cannot be less than the previous recorded page");
    }

    if (currentPage > totalPageCount) {
      throw new Error("Current page cannot exceed the book's total page count");
    }

    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime - activeSession.startTime) / 1000);
    const pagesReadDuringSession = currentPage - previousPage;

    const updatedSession = await prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        endTime: endTime,
        pagesRead: pagesReadDuringSession,
        duration: durationInSeconds
      }
    });

    await bookService.updatePage(userId, bookId, currentPage);

    if (currentPage === totalPageCount) {
      await bookService.updateBookStatus(userId, bookId, 'COMPLETED');
      updatedSession.bookStatus = 'COMPLETED';
    }

    return updatedSession;
  }
}

export default new sessionService();
