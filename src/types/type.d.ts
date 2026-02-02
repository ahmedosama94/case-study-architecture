export interface Type<T = any, A extends any[] = any[]> extends Function { new (...args: A): T; }
