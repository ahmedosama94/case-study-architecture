import { NextFunction, Request, Response } from "express";
import { ValidationError } from "class-validator";

import { ClientError } from "./client-error";

export class ValidationFailureError extends ClientError {
    constructor(public readonly errors: ValidationError[]) {
        super('Validation failed');

        this.name = 'ValidationFailureError';
    }
}

export const isValidationFailureError =
    (err: Error): err is ValidationFailureError => err?.name === 'ValidationFailureError';

export const validationFailureHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (!isValidationFailureError(err) || res.headersSent) {
        next(err);
        return;
    }

    const errors: Record<string, string[]> = {};

    for (const error of err.errors) {
        errors[error.property] ??= [];
        for (const constraintMessage of Object.values(error.constraints ?? {})) {
            errors[error.property].push(constraintMessage);
        }
    }

    res.status(400).json({
        message: err.message,
        errors,
    });

    next(err);
}
