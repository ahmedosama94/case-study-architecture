import type { Request } from 'express';

import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, validate } from 'class-validator';
import { Expose, plainToClass, plainToInstance } from 'class-transformer';
import { inject } from 'inversify';
import {
    controller,
    httpGet,
    httpPatch,
    httpPost,
    request,
    requestBody,
} from 'inversify-express-utils';
import { UserService } from '../services/user-service';

import { BaseController, TYPES } from '../lib';
import { MapDto } from '../decorators/map-dto-decorator';
import { CreateUserDto } from '../repositories';
import { User } from '../entities';
import { ValidationFailureError } from '../errors/validation-failure-error';

export class RegisterUserDto implements CreateUserDto {
    @Expose()
    @IsEmail(undefined, { message: 'Invalid email' })
    @IsNotEmpty({ message: 'Email is required' })
        email: string;

    @Expose()
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @Matches(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/,
        { message: 'Password must be at least 8 characters, with at least one upper case later and one lower case letter' },
    )
        password: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
        firstName: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
        lastName: string;
}

export class LoginDto {
    @Expose()
    @IsEmail()
    @IsNotEmpty()
        email: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
        password: string;
}

export class UpdateProfileDto {
    @Expose()
    @IsString()
    @IsOptional()
        firstName: string;

    @Expose()
    @IsString()
    @IsOptional()
        lastName: string;
}

export class UserDto {
    @Expose()
        email: string;
    @Expose()
        firstName: string;
    @Expose()
        lastName: string;
}

export class TokenDto {
    @Expose()
        token: string;
}

@controller('/users')
export class UserController extends BaseController {
    constructor(
        @inject(TYPES.UserService) private userService: UserService
    ) {
        super();
    }

    @httpPost('/register')
    @MapDto(UserDto)
    async register(@requestBody() body: unknown) {
        const userData = plainToInstance(RegisterUserDto, body, { excludeExtraneousValues: true, exposeUnsetFields: false });
        const errors = await validate(userData);
        if (errors.length > 0) {
            throw new ValidationFailureError(errors);
        }

        return this.userService.register(userData);
    }

    @httpPost('/login')
    @MapDto(TokenDto)
    async authenticate(@requestBody() body: unknown) {
        const loginData = plainToInstance(LoginDto, body);
        const errors = await validate(loginData);
        if (errors.length > 0) {
            throw new ValidationFailureError(errors);
        }

        const token = await this.userService.authenticate(loginData.email, loginData.password)

        return { token };
    }

    @httpGet('/profile', TYPES.JwtAuthMiddleware)
    @MapDto(UserDto)
    // TODO: use @principal
    async getProfile(@request() req: Request & { currentUserId: User['id'] }) {
        return this.userService.getProfile(req.currentUserId);
    }

    @httpPatch('/profile', TYPES.JwtAuthMiddleware)
    @MapDto(UserDto)
    // TODO: use @principal
    async updateProfile(@request() req: Request & { currentUserId: User['id'] }) {
        const userData = plainToClass(UpdateProfileDto, req.body, { excludeExtraneousValues: true, exposeUnsetFields: false });
        const errors = await validate(userData);
        if (errors.length > 0) {
            throw new ValidationFailureError(errors);
        }

        return this.userService.updateProfile(req.currentUserId, userData)
    }
}
