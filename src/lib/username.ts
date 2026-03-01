const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const normalizeUsername = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);

export const isValidUsername = (value: string) => USERNAME_REGEX.test(value);
