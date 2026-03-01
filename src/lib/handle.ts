export const slugifyHandle = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);

export const createDefaultHandle = (email: string) => {
    const [namePart] = email.split("@");
    const base = slugifyHandle(namePart || "journaler") || "journaler";
    const suffix = Math.floor(Math.random() * 9000 + 1000);

    return `${base}${suffix}`;
};
