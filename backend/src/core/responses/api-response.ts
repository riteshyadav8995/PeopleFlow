import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// ──────────────────────────────────────────────
// Standard API response envelope (BRD 16.1)
// ──────────────────────────────────────────────

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  meta?: Record<string, unknown>;
  requestId?: string;
}

export class ApiResponse {
  /**
   * 200 OK — generic success
   */
  static success<T>(res: Response, data: T, message: string = 'Success', meta?: Record<string, unknown>): Response {
    const body: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      meta,
    };
    return res.status(StatusCodes.OK).json(body);
  }

  /**
   * 201 Created
   */
  static created<T>(res: Response, data: T, message: string = 'Resource created'): Response {
    const body: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
    };
    return res.status(StatusCodes.CREATED).json(body);
  }

  /**
   * 204 No Content — for DELETEs
   */
  static noContent(res: Response): Response {
    return res.status(StatusCodes.NO_CONTENT).send();
  }

  /**
   * Error response (used by the error middleware)
   */
  static error(
    res: Response,
    statusCode: number,
    message: string,
    code: string,
    errors?: unknown,
    requestId?: string,
  ): Response {
    const body: ApiResponsePayload = {
      success: false,
      message,
      errors,
      requestId,
    };
    return res.status(statusCode).json(body);
  }
}
