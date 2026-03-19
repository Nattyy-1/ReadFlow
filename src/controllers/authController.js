import authService from '../services/authService.js';

class authController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const result = await authService.register(username, email, password);
      return res.status(201).json(result);

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: "Username or Email already exists" });
      }

      console.error("Registration Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const result = await authService.login(username, password);
      return res.status(200).json({ message: "Login Successful", ...result });

    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ message: error.message || "Internal Server Error" });
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.user.id;

      const result = await authService.getMe(userId);
      return res.status(200).json({ result });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error " });
    }
  }

  async sendResetToken(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      await authService.processPasswordReset(email.toLowerCase());

      return res.status(200).json({
        message: "If an account exists with this email, a reset token has been sent."
      });

    } catch (error) {
      console.error("Forgot Password Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async verifyResetToken(req, res) {
    try {
      const { email, token } = req.body;

      if (!email || !token) {
        return res.status(400).json({ message: "Email and token are required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      await authService.verifyResetToken(email, token);

      return res.status(200).json({
        success: true,
        message: "Token is valid. You may now reset your password."
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid or expired token"
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, token, password } = req.body;

      if (!email || !token || !password) {
        return res.status(400).json({ message: "Email, token, and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      await authService.resetPassword(email, token, password);

      return res.status(200).json({
        message: "Password reset successful. You can now log in with your new password."
      });

    } catch (error) {
      return res.status(400).json({ message: error.message || "Failed to reset password" });
    }
  }
}

export default new authController();
