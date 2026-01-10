import { mock } from "bun:test";
import type { DrizzleDB } from "@/infrastructure/database/connection";

export function createMockDrizzleDB(): DrizzleDB {
  const chainableMock = {
    from: mock().mockReturnThis(),
    where: mock().mockReturnThis(),
    limit: mock().mockReturnThis(),
    prepare: mock().mockReturnValue({
      execute: mock().mockResolvedValue([]),
    }),
    then: mock().mockResolvedValue([]),
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
        then: mock().mockResolvedValue(result),
      }),
      then: mock().mockResolvedValue(result),
    }),
  });
}
