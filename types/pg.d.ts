declare module 'pg' {
  export interface QueryResult<Row = unknown> {
    rows: Row[];
    rowCount: number;
    command: string;
    oid: number;
    fields: unknown[];
  }

  export interface PoolClient {
    query<Row = unknown>(text: string, params?: ReadonlyArray<unknown>): Promise<QueryResult<Row>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: { connectionString?: string; ssl?: { rejectUnauthorized?: boolean } | boolean });
    connect(): Promise<PoolClient>;
    query<Row = unknown>(text: string, params?: ReadonlyArray<unknown>): Promise<QueryResult<Row>>;
    end(): Promise<void>;
  }
}

