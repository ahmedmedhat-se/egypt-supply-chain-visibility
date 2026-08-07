import { Logger } from '@nestjs/common';

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;

function parseBcryptSaltRounds(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (Number.isInteger(parsed) && parsed >= 4 && parsed <= 31) {
    return parsed;
  }
  if (raw) {
    new Logger('PasswordHelper').warn(
      `Invalid BCRYPT_SALT_ROUNDS "${raw}" — falling back to ${DEFAULT_BCRYPT_SALT_ROUNDS}`,
    );
  }
  return DEFAULT_BCRYPT_SALT_ROUNDS;
}

export const BCRYPT_SALT_ROUNDS = parseBcryptSaltRounds(
  process.env.BCRYPT_SALT_ROUNDS,
);
