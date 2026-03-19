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
    try {
      if (!password) {
        throw new Error("Password argument is missing/undefined");
      }
      const rounds = this?.saltRounds || 10;
      return await bcrypt.hash(password, rounds);
    } catch (err) {
      throw new Error('Password hashing failed');
    }
  }

  async #verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (err) {
      throw new Error('Password Verification failed');
    }
  }

  async register(username, email, password) {
    try {
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

    } catch (err) {
      throw err;
    }
  }

  async login(username, password) {
    try {
      const user = await prisma.user.findFirst({
        where: { username: username.toLowerCase() }
      });

      if (user) {
        const isPasswordValid = await this.#verifyPassword(password, user.password);

        if (isPasswordValid) {
          const token = jwt.sign(
            { id: user.id, username: user.username },
            this.jwtSecret,
            { expiresIn: '7d' }
          );

          const { password: _, resetToken: __, resetTokenExpires: ___, ...userWithoutSensitiveData } = user;
          return { user: userWithoutSensitiveData, token };
        }
      }

      const error = new Error("Invalid username or password");
      error.status = 401;
      throw error;

    } catch (err) {
      throw err;
    }
  }

  async getMe(userId) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: parseInt(userId)
        }
      });

      if (!user) throw new Error("User not found");

      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    } catch (err) {
      throw err;
    }
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
      throw new Error('Invalid or expired reset link');
    }

    if (user.resetTokenExpires < new Date()) {
      throw new Error('Reset link has expired');
    }

    const hashedIncomingToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    if (hashedIncomingToken !== user.resetToken) {
      throw new Error('Invalid reset token');
    }

    return true;
  }

  async resetPassword(email, token, password) {
    try {
      await this.verifyResetToken(email, token);

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpires: null
        }
      });

    } catch (err) {
      throw err;
    }
  }
}

export default new AuthService();
