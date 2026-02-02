export * from './base-error';
export * from './client-error';
export * from './not-found-error';
export * from './unauthorized-error';
export * from './validation-failure-error';

import { baseErrorHandler } from './base-error';
import { clientErrorHandler } from './client-error';
import { isNotFoundErrorHandler } from './not-found-error';
import { unauthorizedErrorHandler } from './unauthorized-error';
import { validationFailureHandler } from './validation-failure-error';

// Order matters
export const handlers = [
    validationFailureHandler,
    clientErrorHandler,
    isNotFoundErrorHandler,
    unauthorizedErrorHandler,
    baseErrorHandler,
];
