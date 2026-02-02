import { NextFunction, Request, Response } from "express";

import { ClientError } from "./client-error";

export class NotFoundError extends ClientError {
    constructor(message = 'Not found') {
        super(message);

        this.name = 'NotFoundError';
    }
}

export const isNotFoundError =
    (err: Error): err is NotFoundError => err?.name === 'NotFoundError';

export const isNotFoundErrorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (!isNotFoundError(err) || res.headersSent) {
        next(err);
        return;
    }

    res.status(404).json({
        message: err.message,
    });

    next(err);
}
