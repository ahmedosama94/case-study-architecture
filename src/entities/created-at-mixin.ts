import type { ObjectLiteral } from 'typeorm';

import type { Type } from '../types/type';

import { CreateDateColumn } from 'typeorm';


export function CreatedAtMixin<T extends Type<ObjectLiteral>>(baseClass: T) {
    class NewClass extends baseClass {
        @CreateDateColumn({ name: 'created_at' })
            createdAt: Date;
    }

    return NewClass;
}
