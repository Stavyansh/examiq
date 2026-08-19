// Compatibility facade: use the in-memory database implementation for now.
// This keeps the app compiling under Prisma 7 while preserving the existing imports.
export * from "./db.memory"
