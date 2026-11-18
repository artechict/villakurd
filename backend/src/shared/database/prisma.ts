/**
 * Prisma Client Singleton with Extensions
 * Enhanced Prisma client with soft delete, logging, and utilities
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { config } from '../../config/index.js';

// Global Prisma client instance (prevents multiple instances in development)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma client with extensions
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: config.isDevelopment
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });

  // Query logging in development
  if (config.isDevelopment) {
    client.$on('query', (e) => {
      if (e.duration > 100) {
        console.log(`🐢 Slow query (${e.duration}ms): ${e.query.substring(0, 200)}...`);
      }
    });
  }

  return client;
}

/**
 * Extended Prisma client with soft delete and other utilities
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Soft delete extension
prisma.$extends({
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async aggregate({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async groupBy({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

// Pagination extension
prisma.$extends({
  name: 'pagination',
  model: {
    $allModels: {
      async paginate<T, Args extends Prisma.Args<T, 'findMany'>>(
        this: T,
        args: Omit<Args, 'skip' | 'take'> & { page?: number; limit?: number }
      ): Promise<{ data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const page = args.page ?? 1;
        const limit = Math.min(args.limit ?? 20, 100);
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
          (this as any).findMany({ ...args, skip, take: limit }),
          (this as any).count({ where: args.where }),
        ]);

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
    },
  },
});

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback, {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}

// Batch operations helper
export async function batchCreate<T>(
  model: keyof PrismaClient,
  data: T[],
  batchSize = 100
): Promise<number> {
  let created = 0;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map(item => (prisma[model] as any).create({ data: item }))
    );
    created += batch.length;
  }
  return created;
}

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Graceful shutdown
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

// Assign to global in development to prevent multiple instances
if (config.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

export default prisma;