import { User, JWTPayload, LoginRequest, RegisterRequest } from '../types';
declare class AuthService {
    private users;
    constructor();
    private initializeDefaultUsers;
    register(userData: RegisterRequest): Promise<{
        user: User;
        token: string;
    }>;
    login(credentials: LoginRequest): Promise<{
        user: User;
        token: string;
    }>;
    verifyToken(token: string): JWTPayload;
    private generateToken;
    private getDefaultPermissions;
    getUserById(id: string): User | null;
    getUserByEmail(email: string): User | null;
    updateUserPermissions(userId: string, permissions: string[]): boolean;
    deleteUser(userId: string): boolean;
    getAllUsers(): User[];
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=authService.d.ts.map