import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prismaClient.js';
import sendEmail from '../utils/sendEmail.js';

class AuthService {
  constructor() {
    this.saltRounds = 10;
    this.jwtSecret = process.env.JWT_SECRET || 'this-is-a-fail-safe';
  }

  async #hashPassword(password) {
    if (!password) throw new Error("Password is required");
    return await bcrypt.hash(password, this.saltRounds);
  }

  async #verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async register(username, email, password) {
    const hashedPassword = await this.#hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword
      }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }

  async login(username, password) {
    const user = await prisma.user.findFirst({
      where: { username: username.toLowerCase() }
    });

    if (!user || !(await this.#verifyPassword(password, user.password))) {
      const error = new Error("Invalid username or password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    const {
      password: _,
      resetToken: __,
      resetTokenExpires: ___,
      ...userWithoutSensitiveData
    } = user;

    return { user: userWithoutSensitiveData, token };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const {
      password: _,
      resetToken: __,
      resetTokenExpires: ___,
      ...userWithoutSensitiveData
    } = user;

    return { user: userWithoutSensitiveData };
  }

  async processPasswordReset(email) {
    const user = await prisma.user.findUnique({ // findUnique is faster for @unique fields
      where: { email }
    });

    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedResetToken, // Save the HASH
        resetTokenExpires: tokenExpiry // Save as a Date object
      }
    });

    const resetUrl = `https://readflow.com/reset-password?token=${resetToken}&email=${email}`;

    const message = `
      You requested a password reset for your ReadFlow account.

      Please click the link below to reset your password (valid for 10 minutes):
      ${resetUrl}

      If you did not request this, please ignore this email.
    `.trim();

    await sendEmail({
      email: user.email,
      subject: 'ReadFlow Password Reset',
      message: message,
    });
  }

  async verifyResetToken(email, token) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.resetToken || !user.resetTokenExpires) {
      const error = new Error('Invalid or expired reset link');
      error.statusCode = 400;
      throw error;
    }

    if (user.resetTokenExpires < new Date()) {
      const error = new Error('Reset link has expired');
      error.statusCode = 400;
      throw error;
    }

    const hashedIncomingToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(user.resetToken),
      Buffer.from(hashedIncomingToken)
    );

    if (!isMatch) {
      const error = new Error('Invalid reset token');
      error.statusCode = 400;
      throw error;
    }

    return true;
  }

  async resetPassword(email, token, password) {
    await this.verifyResetToken(email, token);

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });
  }
}

export default new AuthService();
