import { registerDecorator, ValidationArguments } from 'class-validator';

export function PasswordComplexity(message?: string) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: { message: message || 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt' },
      validator: {
        validate(value: string, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Regex: ít nhất 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt, tối thiểu 8 ký tự
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value);
        },
      },
    });
  };
}
