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
}

export default new sessionService();
