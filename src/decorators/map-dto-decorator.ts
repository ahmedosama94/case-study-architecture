import { plainToInstance } from 'class-transformer';
import { Type } from '../types/type';

export const MapDto: (outputDtoClass: Type) => MethodDecorator =  (outputDtoClass) =>
    (target, propetyKey, descriptor) => {
        const originalFn = descriptor.value as (...args: any[]) => any;

        const helperObj = {
            async [originalFn.name](...args: any[]) {
                const result = await Promise.resolve(originalFn.call(this, ...args));

                return plainToInstance(outputDtoClass, result, { excludeExtraneousValues: true, exposeUnsetFields: false });
            },
        };

        (descriptor as any).value = helperObj[originalFn.name];
    };

