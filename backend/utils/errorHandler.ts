import { Response } from 'express';

/**
 * Standard API Error Response format
 */
export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: any;
}

/**
 * Standard API Success Response format
 */
export interface ApiSuccessResponse<T = any> {
    success: true;
    data?: T;
    message?: string;
    count?: number;
}

/**
 * Send a standardized error response
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 500)
 * @param message - Error message
 * @param code - Optional error code for client handling
 * @param details - Optional additional details (validation errors, etc.)
 */
export function sendError(
    res: Response,
    statusCode: number = 500,
    message: string,
    code?: string,
    details?: any
): void {
    const response: ApiErrorResponse = {
        success: false,
        error: message,
    };

    if (code) {
        response.code = code;
    }

    if (details) {
        response.details = details;
    }

    res.status(statusCode).json(response);
}

/**
 * Send a standardized success response
 * @param res - Express response object
 * @param data - Optional data payload
 * @param message - Optional success message
 * @param count - Optional count for list responses
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T = any>(
    res: Response,
    data?: T,
    message?: string,
    count?: number,
    statusCode: number = 200
): void {
    const response: ApiSuccessResponse<T> = {
        success: true,
    };

    if (data !== undefined) {
        response.data = data;
    }

    if (message) {
        response.message = message;
    }

    if (count !== undefined) {
        response.count = count;
    }

    res.status(statusCode).json(response);
}

/**
 * Common HTTP error codes for quick reference
 */
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Common error codes for client-side handling
 */
export const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCESS_DENIED: 'ACCESS_DENIED',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
