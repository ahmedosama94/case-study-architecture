export const TYPES = {
    DB: Symbol.for('DB'),
    producer: Symbol.for('producer'),

    // Services
    UserService: Symbol.for('UserService'),
    PasswordManagerService: Symbol.for('PasswordManagerService'),
    JwtService: Symbol.for('JwtService'),
    JwtAuthMiddleware: Symbol.for('JwtAuthMiddleware'),

    // Repositories
    UserRepository: Symbol.for('UserRepository'),
};
