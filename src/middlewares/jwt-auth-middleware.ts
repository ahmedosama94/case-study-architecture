import type { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';
import { JwtPayload } from 'jsonwebtoken';

import { TYPES } from '../lib';
import { JwtService } from '../services';
import { User } from 'entities';

@injectable()
export class JwtAuthMiddleware extends BaseMiddleware {
    constructor(@inject(TYPES.JwtService) private readonly jwtService: JwtService) {
        super();
    }

    handler(req: Request & { currentUserId?: User['id'] }, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const token = authHeader.slice('Bearer '.length).trim();

        try {
            const payload = this.jwtService.verify<JwtPayload>(token);
            const userId = typeof payload === 'string' ? undefined : payload.id;

            if (!userId || typeof userId !== 'string') {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            req.currentUserId = userId;
            next();
        } catch {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }
}
