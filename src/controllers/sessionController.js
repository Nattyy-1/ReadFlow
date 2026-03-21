import sessionService from "../services/sessionService.js";

class sessionController {
  async startSession(req, res) {
    const bookId = parseInt(req.body.bookId);
    const userId = req.user.id;

    if (!bookId) {
      return res.status(400).json({
        message: "bookId is required to start a session"
      });
    }

    if (isNaN(bookId)) {
      return res.status(400).json({
        message: "A valid numeric bookId is required"
      });
    }

    try {
      const session = await sessionService.startSession(userId, bookId);

      return res.status(201).json({
        message: "Success",
        session
      });

    } catch (error) {

      if (error.message.startsWith("ACTIVE_SESSION_EXISTS")) {
        const bookTitle = error.message.split(":")[1];
        return res.status(400).json({
          message: `You already have an active session for "${bookTitle}".`
        });
      }

      if (error.message === "P2025") {
        return res.status(404).json({
          message: "This book was not found on your shelf."
        });
      }

      console.error("Session Start Error: ", error);
      return res.status(500).json({
        message: "An internal error occurred while starting the session"
      });
    }
  }
}

export default new sessionController();
