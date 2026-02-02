import 'reflect-metadata';
import { PasswordManagerServiceImpl } from './password-manager-service';

describe('Password Manager Service Tests', () => {
    const sut = new PasswordManagerServiceImpl();

    test('basic test', async () => {
        const testPass = await sut.toHash('password123');
        const testResult = await sut.compare(testPass, 'password123');

        expect(testResult).toBe(true);
    });
});
