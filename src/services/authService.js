import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prismaClient.js';

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

          const { password: _, ...userWithoutPassword } = user;
          return { user: userWithoutPassword, token };
        }
      }

      const error = new Error("Invalid username or password");
      error.status = 401;
      throw error;

    } catch (err) {
      throw err;
    }
  }
}

export default new AuthService();
