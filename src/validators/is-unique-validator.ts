import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ObjectLiteral, Repository } from 'typeorm';

export type IsUniqueValidationArguments<T extends ObjectLiteral = ObjectLiteral> = ValidationArguments & {
    constriants: [Repository<T>, string | undefined],
};

export function isUniqueValidationArguments(args?: ValidationArguments | undefined): args is IsUniqueValidationArguments {
    return typeof args === 'object' && !!(args as any).constraints?.[0] && !!(args as any).constraints?.[1];
}

@ValidatorConstraint()
class IsUniqueConstraint implements ValidatorConstraintInterface {
    async validate(value: any, validationArguments?: ValidationArguments | undefined): Promise<boolean> {
        if(!isUniqueValidationArguments(validationArguments)) {
            return false;
        }

        const [repository, customFieldName] = validationArguments.constraints;

        const fieldName = customFieldName ?? validationArguments.property;

        return !(await repository.exist({ where: { [fieldName]: value } }));
    }
}

export type IsUniqueValidationOptions<T extends ObjectLiteral = ObjectLiteral> = ValidationOptions & { repository: Repository<T>, fieldName?: string };

export function IsUnique(validationOptions?: IsUniqueValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsUnique',
            target: object.constructor,
            constraints: [validationOptions?.repository, validationOptions?.fieldName],
            propertyName: propertyName,
            options: validationOptions,
            validator: IsUniqueConstraint,
        });
    };
}
