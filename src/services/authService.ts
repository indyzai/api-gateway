import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { User, JWTPayload, LoginRequest, RegisterRequest } from '../types';
import { logger } from '../utils/logger';

/**
 * In-memory user store (replace with database in production)
 */
interface StoredUser {
  id: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
}

class AuthService {
  private users: Map<string, StoredUser> = new Map();

  constructor() {
    this.initializeDefaultUsers();
  }

  /**
   * Initialize default users for testing
   */
  private initializeDefaultUsers(): void {
    const defaultUsers = [
      {
        email: 'admin@indyzai.com',
        password: 'Admin123!',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
      },
      {
        email: 'user@indyzai.com',
        password: 'User123!',
        role: 'user',
        permissions: ['read', 'write'],
      },
    ];

    defaultUsers.forEach(async (userData) => {
      const hashedPassword = await bcrypt.hash(
        userData.password,
        config.security.bcryptRounds
      );
      const user: StoredUser = {
        id: uuidv4(),
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        permissions: userData.permissions,
        createdAt: new Date(),
      };

      this.users.set(userData.email, user);
    });

    logger.info('Default users initialized', {
      userCount: defaultUsers.length,
      emails: defaultUsers.map((u) => u.email),
    });
  }

  /**
   * Register a new user
   */
  async register(
    userData: RegisterRequest
  ): Promise<{ user: User; token: string }> {
    const { email, password, role = 'user' } = userData;

    // Check if user already exists
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      config.security.bcryptRounds
    );

    // Create user
    const user: StoredUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      role,
      permissions: this.getDefaultPermissions(role),
      createdAt: new Date(),
    };

    this.users.set(email, user);

    logger.info('User registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(
    credentials: LoginRequest
  ): Promise<{ user: User; token: string }> {
    const { email, password } = credentials;

    // Find user
    const storedUser = this.users.get(email);
    if (!storedUser) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, storedUser.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    storedUser.lastLogin = new Date();

    logger.info('User logged in', {
      userId: storedUser.id,
      email: storedUser.email,
      role: storedUser.role,
    });

    // Generate token
    const token = this.generateToken(storedUser);

    return {
      user: {
        id: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
        permissions: storedUser.permissions,
      },
      token,
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: StoredUser): string {
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: `${config.jwt.expiresIn}h`,
      issuer: config.jwt.issuer,
    });
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: ['read', 'write', 'delete', 'admin'],
      moderator: ['read', 'write', 'moderate'],
      user: ['read', 'write'],
    };

    return rolePermissions[role] || ['read'];
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): User | null {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        };
      }
    }
    return null;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | null {
    const user = this.users.get(email);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
  }

  /**
   * Update user permissions
   */
  updateUserPermissions(userId: string, permissions: string[]): boolean {
    for (const [email, user] of this.users.entries()) {
      if (user.id === userId) {
        user.permissions = permissions;
        this.users.set(email, user);

        logger.info('User permissions updated', {
          userId,
          permissions,
        });

        return true;
      }
    }
    return false;
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): boolean {
    for (const [email, user] of this.users.entries()) {
      if (user.id === userId) {
        this.users.delete(email);

        logger.info('User deleted', {
          userId,
          email: user.email,
        });

        return true;
      }
    }
    return false;
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values()).map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    }));
  }
}

export const authService = new AuthService();
