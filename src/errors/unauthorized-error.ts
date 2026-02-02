import { NextFunction, Request, Response } from "express";

import { ClientError } from "./client-error";

export class UnauthorizedError extends ClientError {
    constructor(message = 'Unauthorized') {
        super(message);

        this.name = 'UnauthorizedError';
    }
}

export const isUnauthorizedError =
    (err: Error): err is UnauthorizedError => err.name === 'UnauthorizedError';

export const unauthorizedErrorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (!isUnauthorizedError(err) || res.headersSent) {
        next(err);
        return;
    }

    res.status(401).json({
        message: err.message,
    });

    next(err);
}
