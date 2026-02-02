import 'reflect-metadata';
import { ClientError, NotFoundError } from '../errors';
import { User } from '../entities';
import { UserServiceImpl } from './user-service';

describe('UserServiceImpl', () => {
    const makeSut = () => {
        const passwordManagerService = {
            toHash: jest.fn(),
            compare: jest.fn(),
        };

        const userRepository = {
            emailExists: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            merge: jest.fn(),
            save: jest.fn(),
        };

        const jwtService = {
            sign: jest.fn(),
        };

        const sut = new UserServiceImpl(
            passwordManagerService as any,
            userRepository as any,
            jwtService as any,
        );

        return { sut, passwordManagerService, userRepository, jwtService };
    };

    it('registers a new user with a hashed password', async () => {
        const { sut, passwordManagerService, userRepository } = makeSut();

        userRepository.emailExists.mockResolvedValue(false);
        passwordManagerService.toHash.mockResolvedValue('salt:hash');
        userRepository.create.mockResolvedValue({ id: 'u1' });

        const result = await sut.register({
            email: 'john@example.com',
            password: 'ValidPass1',
            firstName: 'John',
            lastName: 'Doe',
        });

        expect(userRepository.emailExists).toHaveBeenCalledWith('john@example.com');
        expect(passwordManagerService.toHash).toHaveBeenCalledWith('ValidPass1');
        expect(userRepository.create).toHaveBeenCalledWith({
            email: 'john@example.com',
            password: 'salt:hash',
            firstName: 'John',
            lastName: 'Doe',
        });
        expect(result).toEqual({ id: 'u1' });
    });

    it('fails registration when email is already in use', async () => {
        const { sut, userRepository } = makeSut();

        userRepository.emailExists.mockResolvedValue(true);

        await expect(
            sut.register({
                email: 'john@example.com',
                password: 'ValidPass1',
                firstName: 'John',
                lastName: 'Doe',
            }),
        ).rejects.toBeInstanceOf(ClientError);
    });

    it('authenticates and returns token for valid credentials', async () => {
        const { sut, passwordManagerService, userRepository, jwtService } = makeSut();

        const user = { id: 'u1', password: 'salt:hash' } as User;
        userRepository.findByEmail.mockResolvedValue(user);
        passwordManagerService.compare.mockResolvedValue(true);
        jwtService.sign.mockReturnValue('jwt-token');

        const token = await sut.authenticate('john@example.com', 'ValidPass1');

        expect(userRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
        expect(passwordManagerService.compare).toHaveBeenCalledWith('salt:hash', 'ValidPass1');
        expect(jwtService.sign).toHaveBeenCalledWith({ id: 'u1' });
        expect(token).toBe('jwt-token');
    });

    it('fails authentication when user does not exist', async () => {
        const { sut, passwordManagerService, userRepository } = makeSut();

        userRepository.findByEmail.mockResolvedValue(null);

        await expect(sut.authenticate('john@example.com', 'ValidPass1')).rejects.toBeInstanceOf(ClientError);
        expect(passwordManagerService.compare).not.toHaveBeenCalled();
    });

    it('fails authentication when password does not match', async () => {
        const { sut, passwordManagerService, userRepository } = makeSut();

        userRepository.findByEmail.mockResolvedValue({ password: 'salt:hash' });
        passwordManagerService.compare.mockResolvedValue(false);

        await expect(sut.authenticate('john@example.com', 'ValidPass1')).rejects.toBeInstanceOf(ClientError);
    });

    it('returns a profile for an existing user', async () => {
        const { sut, userRepository } = makeSut();
        const user = { id: 'u1' } as User;
        userRepository.findById.mockResolvedValue(user);

        await expect(sut.getProfile('u1')).resolves.toBe(user);
    });

    it('fails profile lookup for missing user', async () => {
        const { sut, userRepository } = makeSut();
        userRepository.findById.mockResolvedValue(null);

        await expect(sut.getProfile('missing')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('updates and saves profile for existing user', async () => {
        const { sut, userRepository } = makeSut();
        const user = { id: 'u1', firstName: 'Old', lastName: 'Name' } as User;

        userRepository.findById.mockResolvedValue(user);
        userRepository.save.mockResolvedValue({ ...user, firstName: 'New' });

        const result = await sut.updateProfile('u1', { firstName: 'New' });

        expect(userRepository.merge).toHaveBeenCalledWith(user, { firstName: 'New' });
        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(result.firstName).toBe('New');
    });

    it('fails profile update for missing user', async () => {
        const { sut, userRepository } = makeSut();
        userRepository.findById.mockResolvedValue(null);

        await expect(sut.updateProfile('missing', { firstName: 'New' })).rejects.toBeInstanceOf(NotFoundError);
    });
});
