import { NextFunction, Request, Response } from "express";
import { BaseError } from "./base-error";

export class ClientError extends BaseError {
    constructor(message = 'Bad request') {
        super(message);

        this.name = 'ClientError';
    }
}

export const isClientError =
    (err: Error): err is ClientError => err.name === 'ClientError';

export const clientErrorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (!isClientError(err) || res.headersSent) {
        next(err);
        return;
    }

    res.status(400).json({
        message: err.message,
    })

    next(err);
};
