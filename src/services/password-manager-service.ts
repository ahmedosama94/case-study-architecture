import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { injectable } from 'inversify';

export interface PasswordManagerService {
    toHash(password: string): Promise<string>;
    compare(storedPassword: string, suppliedPassword: string): Promise<boolean>;
}

const scryptAsync = promisify(scrypt);

/**
 * A utility class to hash user password before storing in DB
 * and compares user supplied passowrd with the stored hash
 */
@injectable()
export class PasswordManagerServiceImpl implements PasswordManagerService {
    async toHash(password: string) {
        const salt = randomBytes(16).toString('hex');
        const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

        return `${salt}:${derivedKey.toString('hex')}`;
    }

    async compare(storedPassword: string, suppliedPassword: string) {
        const [salt, encryptedStoredPassword] = storedPassword.split(':');

        const derivedKey = await (scryptAsync(suppliedPassword, salt, 64)) as Buffer;

        return encryptedStoredPassword === derivedKey.toString('hex');
    }
}
