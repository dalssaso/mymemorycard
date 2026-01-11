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

export function mockInsertResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const insertMock = mockDb.insert as ReturnType<typeof mock>;
  insertMock.mockReturnValue({
    values: mock().mockReturnValue({
      returning: mock().mockResolvedValue(result),
      onConflictDoUpdate: mock().mockResolvedValue(result),
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
