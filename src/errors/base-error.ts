import { NextFunction, Request, Response } from 'express';

export class BaseError extends Error {
    constructor(message = 'Internal server error') {
        super(message);

        this.name = 'BaseError';
    }
}

export const isBaseError =
    (err: Error): err is BaseError => err.name === 'BaseError';

export const baseErrorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (!isBaseError(err) || res.headersSent) {
        next(err);
        return;
    }

    res.status(500).json({
        message: err.message,
    })

    next(err);
};
