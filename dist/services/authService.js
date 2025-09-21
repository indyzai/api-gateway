"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
class AuthService {
    constructor() {
        this.users = new Map();
        this.initializeDefaultUsers();
    }
    initializeDefaultUsers() {
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
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, config_1.default.security.bcryptRounds);
            const user = {
                id: (0, uuid_1.v4)(),
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
                permissions: userData.permissions,
                createdAt: new Date(),
            };
            this.users.set(userData.email, user);
        });
        logger_1.logger.info('Default users initialized', {
            userCount: defaultUsers.length,
            emails: defaultUsers.map((u) => u.email),
        });
    }
    async register(userData) {
        const { email, password, role = 'user' } = userData;
        if (this.users.has(email)) {
            throw new Error('User already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, config_1.default.security.bcryptRounds);
        const user = {
            id: (0, uuid_1.v4)(),
            email,
            password: hashedPassword,
            role,
            permissions: this.getDefaultPermissions(role),
            createdAt: new Date(),
        };
        this.users.set(email, user);
        logger_1.logger.info('User registered', {
            userId: user.id,
            email: user.email,
            role: user.role,
        });
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
    async login(credentials) {
        const { email, password } = credentials;
        const storedUser = this.users.get(email);
        if (!storedUser) {
            throw new Error('Invalid credentials');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, storedUser.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        storedUser.lastLogin = new Date();
        logger_1.logger.info('User logged in', {
            userId: storedUser.id,
            email: storedUser.email,
            role: storedUser.role,
        });
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
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, {
            expiresIn: config_1.default.jwt.expiresIn,
            issuer: config_1.default.jwt.issuer,
        });
    }
    getDefaultPermissions(role) {
        const rolePermissions = {
            admin: ['read', 'write', 'delete', 'admin'],
            moderator: ['read', 'write', 'moderate'],
            user: ['read', 'write'],
        };
        return rolePermissions[role] || ['read'];
    }
    getUserById(id) {
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
    getUserByEmail(email) {
        const user = this.users.get(email);
        if (!user)
            return null;
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        };
    }
    updateUserPermissions(userId, permissions) {
        for (const [email, user] of this.users.entries()) {
            if (user.id === userId) {
                user.permissions = permissions;
                this.users.set(email, user);
                logger_1.logger.info('User permissions updated', {
                    userId,
                    permissions,
                });
                return true;
            }
        }
        return false;
    }
    deleteUser(userId) {
        for (const [email, user] of this.users.entries()) {
            if (user.id === userId) {
                this.users.delete(email);
                logger_1.logger.info('User deleted', {
                    userId,
                    email: user.email,
                });
                return true;
            }
        }
        return false;
    }
    getAllUsers() {
        return Array.from(this.users.values()).map((user) => ({
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        }));
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map