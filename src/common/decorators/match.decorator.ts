import { registerDecorator, ValidationArguments } from 'class-validator';

export function Match(property: string, message?: string) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: { message: message || `${propertyName} phải trùng với ${property}` },
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value === (args.object as any)[args.constraints[0]];
        },
      },
    });
  };
}
