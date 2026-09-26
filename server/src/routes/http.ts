// HTTP error helpers. Throw these from handlers; the error handler in app.ts turns them
// into `{ error, details? }` JSON responses (Express 5 forwards async throws automatically).

export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown): HttpError => new HttpError(400, message, details);

export const forbidden = (message = "You don't have access to that."): HttpError => new HttpError(403, message);

export const notFound = (what: string): HttpError => new HttpError(404, `${what} not found.`);

export const conflict = (message: string, details?: unknown): HttpError => new HttpError(409, message, details);
