import type { ObjectLiteral } from 'typeorm';

import type { Type } from '../types/type';

import { UpdateDateColumn } from 'typeorm';

export function UpdatedAtMixin<T extends Type<ObjectLiteral>>(baseClass: T) {
    class NewClass extends baseClass {
        @UpdateDateColumn({ name: 'updated_at' })
            updatedAt: Date;
    }

    return NewClass;
}
