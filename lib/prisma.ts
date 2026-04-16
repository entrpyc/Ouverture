import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";
import { decrypt, encrypt } from "./encryption";

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
  }
  return raw.startsWith("file:") ? raw.slice("file:".length) : raw;
}

type UserLike = { minimaxApiKey?: string | null } | null | undefined;

function decryptUser<T extends UserLike>(user: T): T {
  if (user && typeof user.minimaxApiKey === "string" && user.minimaxApiKey.length > 0) {
    try {
      user.minimaxApiKey = decrypt(user.minimaxApiKey);
    } catch {
      // Leave the value as-is if it was never encrypted (e.g., legacy or manual rows).
    }
  }
  return user;
}

function encryptWriteArgs(args: { data?: Record<string, unknown> } | undefined) {
  if (!args?.data) return;
  const data = args.data;
  const value = data.minimaxApiKey;
  if (typeof value === "string" && value.length > 0) {
    data.minimaxApiKey = encrypt(value);
  } else if (value && typeof value === "object" && "set" in (value as Record<string, unknown>)) {
    const set = (value as { set?: unknown }).set;
    if (typeof set === "string" && set.length > 0) {
      (value as { set: string }).set = encrypt(set);
    }
  }
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl() });
  return new PrismaClient({ adapter }).$extends({
    query: {
      user: {
        async create({ args, query }) {
          encryptWriteArgs(args);
          return decryptUser(await query(args));
        },
        async update({ args, query }) {
          encryptWriteArgs(args);
          return decryptUser(await query(args));
        },
        async upsert({ args, query }) {
          encryptWriteArgs({ data: args.create });
          encryptWriteArgs({ data: args.update });
          return decryptUser(await query(args));
        },
        async createMany({ args, query }) {
          const data = args.data;
          if (Array.isArray(data)) {
            for (const row of data) encryptWriteArgs({ data: row });
          } else {
            encryptWriteArgs({ data });
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          encryptWriteArgs(args);
          return query(args);
        },
        async findUnique({ args, query }) {
          return decryptUser(await query(args));
        },
        async findUniqueOrThrow({ args, query }) {
          return decryptUser(await query(args));
        },
        async findFirst({ args, query }) {
          return decryptUser(await query(args));
        },
        async findFirstOrThrow({ args, query }) {
          return decryptUser(await query(args));
        },
        async findMany({ args, query }) {
          const rows = await query(args);
          if (Array.isArray(rows)) rows.forEach(decryptUser);
          return rows;
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
