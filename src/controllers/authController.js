import authService from '../services/authService.js';

class authController {
  async register(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      const error = new Error("All fields are required");
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    const result = await authService.register(username, email, password);

    res.status(201).json({
      success: true,
      ...result
    });
  }

  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      const error = new Error("All fields are required");
      error.statusCode = 400;
      throw error;
    }

    const result = await authService.login(username, password);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      ...result
    });
  }

  async getMe(req, res) {
    const userId = req.user.id;

    const result = await authService.getMe(userId);

    res.status(200).json({
      success: true,
      ...result
    });
  }

  async sendResetToken(req, res) {
    const { email } = req.body;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    await authService.processPasswordReset(email.toLowerCase());

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a reset token has been sent."
    });
  }

  async verifyResetToken(req, res) {
    const { email, token } = req.body;

    if (!email || !token) {
      const error = new Error("Email and token are required");
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    await authService.verifyResetToken(email, token);

    res.status(200).json({
      success: true,
      message: "Token is valid. You may now reset your password."
    });
  }

  async resetPassword(req, res) {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      const error = new Error("Email, token, and password are required");
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      throw error;
    }

    await authService.resetPassword(email, token, password);

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in with your new password."
    });
  }
}

export default new authController();
