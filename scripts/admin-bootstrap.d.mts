export function isStrongAdminPassword(password: string): boolean;

export function createAdminIfMissing(
  pool: {
    query(
      text: string,
      values?: unknown[],
    ): Promise<{ rows: Array<{ id?: string }> }>;
  },
  email: string,
  password: string,
): Promise<{ created: boolean }>;
