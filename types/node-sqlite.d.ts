// Type declarations for node:sqlite (built-in Node 22+)
// Official types land in @types/node v22+. This shim covers Node 22 with @types/node v20.
declare module 'node:sqlite' {
  interface RunResult {
    changes: number
    lastInsertRowid: number | bigint
  }

  class StatementSync {
    all(...params: unknown[]): Record<string, unknown>[]
    get(...params: unknown[]): Record<string, unknown> | undefined
    run(...params: unknown[]): RunResult
  }

  class DatabaseSync {
    constructor(location: string, options?: { open?: boolean; readOnly?: boolean })
    exec(sql: string): void
    prepare(sql: string): StatementSync
    close(): void
  }
}
