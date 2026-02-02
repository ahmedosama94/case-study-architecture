import { injectable } from 'inversify';
import {
    sign as jwtSign,
    verify as jwtVerify,
    JwtPayload,
    SignOptions,
    VerifyOptions,
} from 'jsonwebtoken';
import { StringValue } from 'ms';

export interface JwtService {
    sign(payload: string | Buffer | object, options?: SignOptions): string;
    verify<T extends JwtPayload | string = JwtPayload>(token: string, options?: VerifyOptions): T;
}

@injectable()
export class JwtServiceImpl implements JwtService {
    private readonly secret: string;
    private readonly expiresIn?: string;

    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not set');
        }

        this.secret = secret;
        this.expiresIn = process.env.JWT_EXPIRES_IN;
    }

    sign(payload: string | Buffer | object, options: SignOptions = {}) {
        const signOptions: SignOptions = { ...options };

        if (this.expiresIn && signOptions.expiresIn === undefined) {
            signOptions.expiresIn = this.expiresIn as StringValue;
        }

        return jwtSign(payload, this.secret, signOptions);
    }

    verify<T extends JwtPayload | string = JwtPayload>(token: string, options?: VerifyOptions) {
        return jwtVerify(token, this.secret, options) as T;
    }
}
