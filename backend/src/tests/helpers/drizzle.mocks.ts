import { mock } from "bun:test";
import type { DrizzleDB } from "@/infrastructure/database/connection";

export function createMockDrizzleDB(): DrizzleDB {
  const chainableMock = {
    from: mock().mockReturnThis(),
    where: mock().mockReturnThis(),
    limit: mock().mockResolvedValue([]),
    prepare: mock().mockReturnValue({
      execute: mock().mockResolvedValue([]),
    }),
  };

  return {
    select: mock().mockReturnValue(chainableMock),
    insert: mock().mockReturnValue({
      values: mock().mockReturnValue({
        returning: mock().mockResolvedValue([]),
      }),
    }),
    execute: mock().mockResolvedValue({ rows: [] }),
  } as unknown as DrizzleDB;
}

export function mockSelectResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      where: mock().mockReturnValue({
        limit: mock().mockResolvedValue(result),
      }),
    }),
  });
}

/**
 * Mock a successful select().from().orderBy() chain with a resolved result.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockSelectAllResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      orderBy: mock().mockResolvedValue(result),
    }),
  });
}

/**
 * Mock a failed select().from().orderBy() chain with a rejected error.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param error - Error to reject with.
 */
export function mockSelectAllError(mockDb: DrizzleDB, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      orderBy: mock().mockRejectedValue(error),
    }),
  });
}

export function mockInsertResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const insertMock = mockDb.insert as ReturnType<typeof mock>;
  insertMock.mockReturnValue({
    values: mock().mockReturnValue({
      returning: mock().mockResolvedValue(result),
    }),
  });
}

export function mockInsertError(mockDb: DrizzleDB, error: Error): void {
  const insertMock = mockDb.insert as ReturnType<typeof mock>;
  insertMock.mockReturnValue({
    values: mock().mockReturnValue({
      returning: mock().mockRejectedValue(error),
    }),
  });
}

/**
 * Mock a successful insert().values().onConflictDoUpdate().returning() chain (upsert pattern).
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockUpsertResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const insertMock = mockDb.insert as ReturnType<typeof mock>;
  insertMock.mockReturnValue({
    values: mock().mockReturnValue({
      onConflictDoUpdate: mock().mockReturnValue({
        returning: mock().mockResolvedValue(result),
      }),
    }),
  });
}

/**
 * Mock a failed insert().values().onConflictDoUpdate().returning() chain (upsert pattern).
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param error - Error to reject with.
 */
export function mockUpsertError(mockDb: DrizzleDB, error: Error): void {
  const insertMock = mockDb.insert as ReturnType<typeof mock>;
  insertMock.mockReturnValue({
    values: mock().mockReturnValue({
      onConflictDoUpdate: mock().mockReturnValue({
        returning: mock().mockRejectedValue(error),
      }),
    }),
  });
}

/**
 * Mock a successful select().from().where() chain (no limit).
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockSelectWhereResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      where: mock().mockResolvedValue(result),
    }),
  });
}

/**
 * Mock a failed select().from().where() chain (no limit).
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param error - Error to reject with.
 */
export function mockSelectWhereError(mockDb: DrizzleDB, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      where: mock().mockRejectedValue(error),
    }),
  });
}

export function mockSelectError(mockDb: DrizzleDB, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      where: mock().mockReturnValue({
        limit: mock().mockRejectedValue(error),
      }),
    }),
  });
}

/**
 * Mock a successful select().from().limit() chain (no where clause).
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockSelectLimitResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue(result),
    }),
  });
}

/**
 * Mock a failed select().from().limit() chain (no where clause).
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param error - Error to reject with.
 */
export function mockSelectLimitError(mockDb: DrizzleDB, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockRejectedValue(error),
    }),
  });
}

/**
 * Mock a successful select().from().where().orderBy() chain.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockSelectWhereOrderByResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      where: mock().mockReturnValue({
        orderBy: mock().mockResolvedValue(result),
      }),
    }),
  });
}

/**
 * Mock a successful delete().where().returning() chain.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockDeleteResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const deleteMock = mock().mockReturnValue({
    where: mock().mockReturnValue({
      returning: mock().mockResolvedValue(result),
    }),
  });
  Object.defineProperty(mockDb, "delete", { value: deleteMock, writable: true });
}

/**
 * Mock a failed delete().where().returning() chain.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param error - Error to reject with.
 */
export function mockDeleteError(mockDb: DrizzleDB, error: Error): void {
  const deleteMock = mock().mockReturnValue({
    where: mock().mockReturnValue({
      returning: mock().mockRejectedValue(error),
    }),
  });
  Object.defineProperty(mockDb, "delete", { value: deleteMock, writable: true });
}

/**
 * Mock a successful select().from().innerJoin().innerJoin().leftJoin().where().limit() chain.
 * Used for queries that join multiple tables (e.g., userGames with games, platforms, stores).
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockSelectJoinResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      innerJoin: mock().mockReturnValue({
        innerJoin: mock().mockReturnValue({
          leftJoin: mock().mockReturnValue({
            where: mock().mockReturnValue({
              limit: mock().mockResolvedValue(result),
              offset: mock().mockReturnValue({
                limit: mock().mockResolvedValue(result),
              }),
            }),
          }),
        }),
      }),
    }),
  });
}

/**
 * Mock a successful update().set().where().returning() chain.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param result - Result rows to resolve.
 */
export function mockUpdateResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const updateMock = mock().mockReturnValue({
    set: mock().mockReturnValue({
      where: mock().mockReturnValue({
        returning: mock().mockResolvedValue(result),
      }),
    }),
  });
  Object.defineProperty(mockDb, "update", { value: updateMock, writable: true });
}

/**
 * Mock a failed update().set().where().returning() chain.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param error - Error to reject with.
 */
export function mockUpdateError(mockDb: DrizzleDB, error: Error): void {
  const updateMock = mock().mockReturnValue({
    set: mock().mockReturnValue({
      where: mock().mockReturnValue({
        returning: mock().mockRejectedValue(error),
      }),
    }),
  });
  Object.defineProperty(mockDb, "update", { value: updateMock, writable: true });
}

/**
 * Mock a transaction that passes a transaction context to the callback.
 * The transaction context has the same mocked query and insert methods as the db.
 *
 * @param mockDb - Mocked Drizzle DB instance.
 * @param txContext - Optional custom transaction context (defaults to using mockDb itself).
 */
export function mockTransaction(mockDb: DrizzleDB, txContext?: Partial<DrizzleDB>): void {
  const transactionMock = mock().mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const tx = txContext ?? mockDb;
    return callback(tx);
  });
  Object.defineProperty(mockDb, "transaction", { value: transactionMock, writable: true });
}
