import authService from '../services/authService.js';

class authController {
  async register(req, res) {
    const { username, email, password } = req.body;

    const result = await authService.register(username, email, password);

    res.status(201).json({
      success: true,
      ...result
    });
  }

  async login(req, res) {
    const { username, password } = req.body;

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

    await authService.processPasswordReset(email.toLowerCase());

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a reset token has been sent."
    });
  }

  async verifyResetToken(req, res) {
    const { email, token } = req.body;

    await authService.verifyResetToken(email, token);

    res.status(200).json({
      success: true,
      message: "Token is valid. You may now reset your password."
    });
  }

  async resetPassword(req, res) {
    const { email, token, password } = req.body;

    await authService.resetPassword(email, token, password);

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in with your new password."
    });
  }

  async googleLogin(req, res) {
    const { idToken } = req.body;

    const result = await authService.googleLogin(idToken);

    res.status(200).json({
      success: true,
      message: "Google Login Successful",
      ...result
    });
  }

  async updateProfile(req, res) {
    const userId = req.user.id;
    const { username, password } = req.body;

    const updatedProfile = await authService.updateProfile(userId, username, password);

    res.status(200).json({
      success: true,
      message: "Profile Update Successful",
      ...updatedProfile
    });

  }
}

export default new authController();
