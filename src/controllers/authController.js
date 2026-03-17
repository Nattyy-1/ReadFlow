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
}

export default new authController();
