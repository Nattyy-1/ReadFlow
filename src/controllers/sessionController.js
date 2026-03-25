import sessionService from "../services/sessionService.js";

class sessionController {
  async startSession(req, res) {
    const bookId = parseInt(req.body.bookId);
    const userId = req.user.id;

    if (!bookId || isNaN(bookId)) {
      const error = new Error("A valid numeric bookId is required to start a session");
      error.statusCode = 400;
      throw error;
    }

    const session = await sessionService.startSession(userId, bookId);

    res.status(201).json({
      success: true,
      session
    });
  }

  async stopSession(req, res) {
    const sessionId = parseInt(req.body.sessionId, 10);
    const currentPage = parseInt(req.body.currentPage, 10);

    if (isNaN(sessionId) || isNaN(currentPage)) {
      const error = new Error("Valid numeric sessionId and currentPage are required.");
      error.statusCode = 400;
      throw error;
    }

    const session = await sessionService.endSession(sessionId, currentPage);

    res.status(200).json({
      success: true,
      message: "Reading session recorded successfully.",
      data: {
        duration: session.duration,
        pagesRead: session.pagesRead,
        endTime: session.endTime,
        status: session.bookStatus || 'READING'
      }
    });
  }

  async getSessionsForBook(req, res) {
    const userId = req.user.id;
    const bookId = parseInt(req.params.bookId);

    if (isNaN(bookId)) {
      const error = new Error("A numeric bookId must be provided");
      error.statusCode = 400;
      throw error;
    }

    const sessions = await sessionService.getSessions(userId, bookId);

    res.status(200).json({
      success: true,
      data: sessions
    });
  }

  async getAllSessions(req, res) {
    const userId = req.user.id;

    const sessions = await sessionService.getSessions(userId);

    res.status(200).json({
      success: true,
      data: sessions
    });
  }
}

export default new sessionController();
