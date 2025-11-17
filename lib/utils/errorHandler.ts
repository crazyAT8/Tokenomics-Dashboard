/**
 * Error handling utilities for better error messages and user feedback
 */

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  isNetworkError: boolean;
  isTimeoutError: boolean;
  isRateLimitError: boolean;
  isServerError: boolean;
  isClientError: boolean;
  retryable: boolean;
}

/**
 * Parses an error and returns a structured error object
 */
export function parseError(error: any): ApiError {
  const isNetworkError = !error.response && (error.code || error.message?.includes('Network'));
  const isTimeoutError = 
    error.code === 'ECONNABORTED' || 
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('timeout') ||
    error.message?.includes('TIMEOUT');
  const isRateLimitError = error.response?.status === 429;
  const isServerError = error.response?.status >= 500 && error.response?.status < 600;
  const isClientError = error.response?.status >= 400 && error.response?.status < 500;

  const retryable = 
    isNetworkError || 
    isTimeoutError || 
    isRateLimitError || 
    isServerError ||
    (isClientError && [408, 429].includes(error.response?.status));

  let message = 'An unexpected error occurred';

  if (isNetworkError) {
    message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (isTimeoutError) {
    message = 'Request timed out. The server is taking too long to respond.';
  } else if (isRateLimitError) {
    message = 'Too many requests. Please wait a moment and try again.';
  } else if (isServerError) {
    message = 'Server error. The service is temporarily unavailable.';
  } else if (error.response?.status === 404) {
    message = 'The requested resource was not found.';
  } else if (error.response?.status === 403) {
    message = 'Access forbidden. You may not have permission to access this resource.';
  } else if (error.response?.status === 401) {
    message = 'Authentication failed. Please check your API key.';
  } else if (error.response?.data?.error) {
    message = error.response.data.error;
  } else if (error.message) {
    message = error.message;
  }

  return {
    message,
    statusCode: error.response?.status,
    code: error.code,
    isNetworkError,
    isTimeoutError,
    isRateLimitError,
    isServerError,
    isClientError,
    retryable,
  };
}

/**
 * Gets a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  if (error.isNetworkError) {
    return 'Connection Error: Please check your internet connection and try again.';
  }
  
  if (error.isTimeoutError) {
    return 'Timeout Error: The request took too long. Please try again.';
  }
  
  if (error.isRateLimitError) {
    return 'Rate Limit: Too many requests. Please wait a moment before trying again.';
  }
  
  if (error.isServerError) {
    return 'Server Error: The service is temporarily unavailable. Please try again later.';
  }
  
  return error.message;
}

