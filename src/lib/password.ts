import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = (rawPassword: string) => hash(rawPassword, SALT_ROUNDS);

export const verifyPassword = (rawPassword: string, passwordHash: string) =>
    compare(rawPassword, passwordHash);
