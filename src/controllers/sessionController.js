import sessionService from "../services/sessionService.js";

class sessionController {
  async startSession(req, res) {
    const { bookId } = req.body;
    const userId = req.user.id;

    const session = await sessionService.startSession(userId, bookId);

    res.status(201).json({
      success: true,
      session
    });
  }

  async stopSession(req, res) {
    const { sessionId, currentPage } = req.body;

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
    const { bookId } = req.validData.params;

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
