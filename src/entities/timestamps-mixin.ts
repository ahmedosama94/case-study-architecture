import type { ObjectLiteral } from 'typeorm';

import type { Type } from '../types/type';

import { CreatedAtMixin } from './created-at-mixin';
import { UpdatedAtMixin } from './updated-at-mixin';

export function TimestampsMixin<T extends Type<ObjectLiteral>>(baseClass: T) {
    class NewClass extends UpdatedAtMixin(CreatedAtMixin(baseClass)) {
    }

    return NewClass;
}
