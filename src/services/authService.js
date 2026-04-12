import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prismaClient.js';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';

class AuthService {
  constructor() {
    this.saltRounds = 10;
    this.jwtSecret = config.jwtSecret;
    this.googleClient = new OAuth2Client(config.google.clientId);
  }

  async #verifyGoogleToken(idToken) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });
      return ticket.getPayload();
    } catch (error) {
      const authError = new Error("Invalid or expired Google token");
      authError.statusCode = 401;
      throw authError;
    }
  }

  async #hashPassword(password) {
    if (!password) throw new Error("Password is required");
    return await bcrypt.hash(password, this.saltRounds);
  }

  async #verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async #generateUniqueUsername(name) {
    const sourceName = name || "user";
    let baseUsername = sourceName.replace(/\s+/g, '').toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { username: baseUsername }
    });

    if (!existingUser) return baseUsername;

    const suffix = Math.random().toString(36).substring(2, 6);
    return `${baseUsername}_${suffix}`;
  }

  #generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
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

    const token = this.#generateToken(user);

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

    const token = this.#generateToken(user);

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

    const appUrl = (config.appUrl || 'http://localhost:5000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const message = `
      You requested a password reset for your ReadFlow account.

      Please click the link below to reset your password (valid for 10 minutes):
      ${resetUrl}

      If you did not request this, please ignore this email.
    `.trim();

    try {
      await sendEmail({
        email: user.email,
        subject: 'ReadFlow Password Reset',
        message: message,
      });
    } catch (error) {
      console.error('Failed to send password reset email', error);
    }
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

    if (user.resetToken.length !== hashedIncomingToken.length) {
      const error = new Error('Invalid reset token');
      error.statusCode = 400;
      throw error;
    }

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
  async googleLogin(idToken) {
    const payload = await this.#verifyGoogleToken(idToken);
    const { sub: googleId, email, name } = payload;

    let user = await prisma.user.findUnique({
      where: { googleId }
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: 'google' }
        });
      } else {
        const username = await this.#generateUniqueUsername(name);
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            username,
            googleId,
            authProvider: 'google'
          }
        });
      }
    }

    const token = this.#generateToken(user);

    const {
      password: _,
      resetToken: __,
      resetTokenExpires: ___,
      ...userWithoutSensitiveData
    } = user;

    return { user: userWithoutSensitiveData, token };
  }

  async updateProfile(userId, username, password) {
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: { username }
      });
      if (existingUsername && existingUsername.id !== userId) {
        const error = new Error("Username is already taken");
        error.statusCode = 409;
        throw error;
      }
    }

    const updateData = {
      ...(username && { username }),
      ...(password && { password: await bcrypt.hash(password, this.saltRounds) })
    };

    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    const {
      password: _,
      resetToken: __,
      resetTokenExpires: ___,
      ...userWithoutSensitiveData
    } = updatedProfile;

    return { user: userWithoutSensitiveData };
  }
}

export default new AuthService();
