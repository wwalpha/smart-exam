export class ApiError extends Error {
  statusCode: number;
  errorCodes: string[];
  reasonCodes: string[];
  requestId?: string;

  constructor(
    message: string,
    statusCode: number,
    errorCodes: string[] = [],
    reasonCodes: string[] = [],
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCodes = errorCodes;
    this.reasonCodes = reasonCodes;
    this.requestId = requestId;
  }
}
