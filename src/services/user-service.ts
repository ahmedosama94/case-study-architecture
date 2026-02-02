import { injectable, inject } from 'inversify';

import { TYPES } from '../lib';
import { UpdateUserDto, UserRepository } from '../repositories';
import { User } from '../entities';
import { PasswordManagerService } from './password-manager-service';
import { JwtService } from './jwt-service';
import { RegisterUserDto } from '../controllers/user-controller';
import { ClientError, NotFoundError } from '../errors';

export type UpdateProfileDto = UpdateUserDto;

export interface UserService {
    register(userData: RegisterUserDto): Promise<User>;
    authenticate(email: User['email'], password: User['password']): Promise<string>;
    getProfile(userId: string): Promise<User>;
    updateProfile(userId: string, data: UpdateProfileDto): Promise<User>;
}

@injectable()
export class UserServiceImpl implements UserService {
    constructor(
        @inject(TYPES.PasswordManagerService) private readonly passwordManagerService: PasswordManagerService,
        @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
        @inject(TYPES.JwtService) private readonly jwtService: JwtService,
    ) {}

    async register(userData: RegisterUserDto) {
        const { email } = userData;

        const emailInUse = await this.userRepository.emailExists(email);
        if (emailInUse) {
            throw new ClientError('Email already in use');
        }

        userData.password = await this.passwordManagerService.toHash(userData.password);

        return this.userRepository.create(userData);
    }

    async authenticate(email: User['email'], password: User['password']) {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new ClientError('Incorrect email and/or password');
        }

        const validPassword = await this.passwordManagerService.compare(user.password, password);

        if (!validPassword) {
            throw new ClientError('Incorrect email and/or password');
        }

        return this.jwtService.sign({ id: user.id });
    }

    async getProfile(userId: string) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, data: UpdateProfileDto) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        this.userRepository.merge(user, data)

        return this.userRepository.save(user);
    }

    getUser(userId: string) {
        return this.userRepository.findById(userId);
    }
}
