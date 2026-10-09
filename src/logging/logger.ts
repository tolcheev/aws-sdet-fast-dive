export function logInfo(event: string, fields: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      level: 'info',
      event,
      ts: new Date().toISOString(),
      ...fields
    })
  );
}

export function logError(event: string, error: unknown, fields: Record<string, unknown> = {}): void {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const message = error instanceof Error ? error.message || error.name : String(error);

  console.error(
    JSON.stringify({
      level: 'error',
      event,
      ts: new Date().toISOString(),
      errorName,
      error: message,
      ...fields
    })
  );
}
