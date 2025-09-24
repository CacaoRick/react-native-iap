/**
 * Error mapping utilities for react-native-iap.
 * Provides helpers for working with platform-specific error codes
 * and constructing structured purchase errors.
 */

import {ErrorCode, type IapPlatform} from '../types';

const ERROR_CODE_ALIASES: Record<string, ErrorCode> = {
  E_USER_CANCELED: ErrorCode.UserCancelled,
  USER_CANCELED: ErrorCode.UserCancelled,
  E_USER_CANCELLED: ErrorCode.UserCancelled,
  USER_CANCELLED: ErrorCode.UserCancelled,
};

const toKebabCase = (str: string): string => {
  if (str.includes('_')) {
    return str
      .split('_')
      .map((word) => word.toLowerCase())
      .join('-');
  } else {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }
};

export interface PurchaseErrorProps {
  message?: string;
  responseCode?: number;
  debugMessage?: string;
  code?: ErrorCode | string | number;
  productId?: string;
  platform?: IapPlatform;
}

export interface PurchaseError extends Error {
  responseCode?: number;
  debugMessage?: string;
  code?: ErrorCode;
  productId?: string;
  platform?: IapPlatform;
}

const normalizePlatform = (platform: IapPlatform): 'ios' | 'android' =>
  typeof platform === 'string' && platform.toLowerCase() === 'ios'
    ? 'ios'
    : 'android';

const COMMON_ERROR_CODE_MAP: Record<ErrorCode, string> = {
  [ErrorCode.Unknown]: ErrorCode.Unknown,
  [ErrorCode.UserCancelled]: ErrorCode.UserCancelled,
  [ErrorCode.UserError]: ErrorCode.UserError,
  [ErrorCode.ItemUnavailable]: ErrorCode.ItemUnavailable,
  [ErrorCode.RemoteError]: ErrorCode.RemoteError,
  [ErrorCode.NetworkError]: ErrorCode.NetworkError,
  [ErrorCode.ServiceError]: ErrorCode.ServiceError,
  [ErrorCode.ReceiptFailed]: ErrorCode.ReceiptFailed,
  [ErrorCode.ReceiptFinished]: ErrorCode.ReceiptFinished,
  [ErrorCode.ReceiptFinishedFailed]: ErrorCode.ReceiptFinishedFailed,
  [ErrorCode.NotPrepared]: ErrorCode.NotPrepared,
  [ErrorCode.NotEnded]: ErrorCode.NotEnded,
  [ErrorCode.AlreadyOwned]: ErrorCode.AlreadyOwned,
  [ErrorCode.DeveloperError]: ErrorCode.DeveloperError,
  [ErrorCode.BillingResponseJsonParseError]:
    ErrorCode.BillingResponseJsonParseError,
  [ErrorCode.DeferredPayment]: ErrorCode.DeferredPayment,
  [ErrorCode.Interrupted]: ErrorCode.Interrupted,
  [ErrorCode.IapNotAvailable]: ErrorCode.IapNotAvailable,
  [ErrorCode.PurchaseError]: ErrorCode.PurchaseError,
  [ErrorCode.SyncError]: ErrorCode.SyncError,
  [ErrorCode.TransactionValidationFailed]:
    ErrorCode.TransactionValidationFailed,
  [ErrorCode.ActivityUnavailable]: ErrorCode.ActivityUnavailable,
  [ErrorCode.AlreadyPrepared]: ErrorCode.AlreadyPrepared,
  [ErrorCode.Pending]: ErrorCode.Pending,
  [ErrorCode.ConnectionClosed]: ErrorCode.ConnectionClosed,
  [ErrorCode.InitConnection]: ErrorCode.InitConnection,
  [ErrorCode.ServiceDisconnected]: ErrorCode.ServiceDisconnected,
  [ErrorCode.QueryProduct]: ErrorCode.QueryProduct,
  [ErrorCode.SkuNotFound]: ErrorCode.SkuNotFound,
  [ErrorCode.SkuOfferMismatch]: ErrorCode.SkuOfferMismatch,
  [ErrorCode.ItemNotOwned]: ErrorCode.ItemNotOwned,
  [ErrorCode.BillingUnavailable]: ErrorCode.BillingUnavailable,
  [ErrorCode.FeatureNotSupported]: ErrorCode.FeatureNotSupported,
  [ErrorCode.EmptySkuList]: ErrorCode.EmptySkuList,
};

export const ErrorCodeMapping = {
  ios: COMMON_ERROR_CODE_MAP,
  android: COMMON_ERROR_CODE_MAP,
} as const;

const OPENIAP_ERROR_CODE_SET: Set<string> = new Set(Object.values(ErrorCode));

export const createPurchaseError = (
  props: PurchaseErrorProps,
): PurchaseError => {
  const errorCode = props.code
    ? typeof props.code === 'string' || typeof props.code === 'number'
      ? ErrorCodeUtils.fromPlatformCode(props.code, props.platform || 'ios')
      : props.code
    : undefined;

  const error = new Error(
    props.message ?? 'Unknown error occurred',
  ) as PurchaseError;
  error.name = '[react-native-iap]: PurchaseError';
  error.responseCode = props.responseCode;
  error.debugMessage = props.debugMessage;
  error.code = errorCode;
  error.productId = props.productId;
  error.platform = props.platform;
  return error;
};

export const createPurchaseErrorFromPlatform = (
  errorData: PurchaseErrorProps,
  platform: IapPlatform,
): PurchaseError => {
  const normalizedPlatform = normalizePlatform(platform);
  const errorCode = errorData.code
    ? typeof errorData.code === 'string' || typeof errorData.code === 'number'
      ? ErrorCodeUtils.fromPlatformCode(errorData.code, normalizedPlatform)
      : errorData.code
    : ErrorCode.Unknown;

  return createPurchaseError({
    message: errorData.message ?? 'Unknown error occurred',
    responseCode: errorData.responseCode,
    debugMessage: errorData.debugMessage,
    code: errorCode,
    productId: errorData.productId,
    platform,
  });
};

export const ErrorCodeUtils = {
  getNativeErrorCode: (errorCode: ErrorCode): string => {
    return errorCode;
  },
  fromPlatformCode: (
    platformCode: string | number,
    _platform: IapPlatform,
  ): ErrorCode => {
    if (typeof platformCode === 'string') {
      // Handle direct ErrorCode enum values
      if (OPENIAP_ERROR_CODE_SET.has(platformCode)) {
        return platformCode as ErrorCode;
      }

      // Handle E_ prefixed codes
      if (platformCode.startsWith('E_')) {
        const withoutE = platformCode.substring(2);
        const kebabCase = toKebabCase(withoutE);
        if (OPENIAP_ERROR_CODE_SET.has(kebabCase)) {
          return kebabCase as ErrorCode;
        }
      }

      // Handle kebab-case codes
      const kebabCase = toKebabCase(platformCode);
      if (OPENIAP_ERROR_CODE_SET.has(kebabCase)) {
        return kebabCase as ErrorCode;
      }

      // Handle legacy formats like USER_CANCELED
      const upperCase = platformCode.toUpperCase();
      if (upperCase === 'USER_CANCELED' || upperCase === 'E_USER_CANCELED') {
        return ErrorCode.UserCancelled;
      }
    }

    return ErrorCode.Unknown;
  },
  toPlatformCode: (
    errorCode: ErrorCode,
    _platform: IapPlatform,
  ): string | number => {
    return COMMON_ERROR_CODE_MAP[errorCode] ?? 'E_UNKNOWN';
  },
  isValidForPlatform: (
    errorCode: ErrorCode,
    platform: IapPlatform,
  ): boolean => {
    return errorCode in ErrorCodeMapping[normalizePlatform(platform)];
  },
};

// ---------------------------------------------------------------------------
// Convenience helpers for interpreting error objects
// ---------------------------------------------------------------------------

type ErrorLike = string | {code?: ErrorCode | string; message?: string};

const ERROR_CODES = new Set<string>(Object.values(ErrorCode));

const normalizeErrorCode = (
  code?: string | ErrorCode | null,
): string | undefined => {
  if (!code) {
    return undefined;
  }

  // If it's already an ErrorCode enum value, return it as string
  if (typeof code !== 'string' && ERROR_CODES.has(code as string)) {
    return code as string;
  }

  if (ERROR_CODES.has(code as string)) {
    return code as string;
  }

  const camelCased = toKebabCase(code as string);
  if (ERROR_CODES.has(camelCased)) {
    return camelCased;
  }

  if (typeof code === 'string' && code.startsWith('E_')) {
    const trimmed = code.substring(2);
    if (ERROR_CODES.has(trimmed)) {
      return trimmed;
    }
    const camelTrimmed = toKebabCase(trimmed);
    if (ERROR_CODES.has(camelTrimmed)) {
      return camelTrimmed;
    }
  }

  // Handle legacy formats
  if (code === 'E_USER_CANCELED') {
    return ErrorCode.UserCancelled;
  }

  return code as string;
};

function extractCode(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return normalizeErrorCode(error);
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as {code?: string | ErrorCode}).code;
    return normalizeErrorCode(typeof code === 'string' ? code : code);
  }

  return undefined;
}

export function isUserCancelledError(error: unknown): boolean {
  return extractCode(error) === ErrorCode.UserCancelled;
}

export function isNetworkError(error: unknown): boolean {
  const networkErrors: ErrorCode[] = [
    ErrorCode.NetworkError,
    ErrorCode.RemoteError,
    ErrorCode.ServiceError,
    ErrorCode.ServiceDisconnected,
    ErrorCode.BillingUnavailable,
  ];

  const code = extractCode(error);
  return !!code && (networkErrors as string[]).includes(code);
}

export function isRecoverableError(error: unknown): boolean {
  const recoverableErrors: string[] = [
    ErrorCode.NetworkError,
    ErrorCode.RemoteError,
    ErrorCode.ServiceError,
    ErrorCode.Interrupted,
    ErrorCode.ServiceDisconnected,
    ErrorCode.BillingUnavailable,
    ErrorCode.QueryProduct,
    ErrorCode.InitConnection,
    ErrorCode.SyncError,
    ErrorCode.ConnectionClosed,
  ];

  const code = extractCode(error);
  return !!code && recoverableErrors.includes(code);
}

export function getUserFriendlyErrorMessage(error: ErrorLike): string {
  const errorCode = extractCode(error);

  switch (errorCode) {
    case ErrorCode.UserCancelled:
      return 'Purchase cancelled';
    case ErrorCode.NetworkError:
      return 'Network connection error. Please check your internet connection and try again.';
    case ErrorCode.ReceiptFinished:
      return 'Receipt already finished';
    case ErrorCode.ServiceDisconnected:
      return 'Billing service disconnected. Please try again.';
    case ErrorCode.BillingUnavailable:
      return 'Billing is unavailable on this device or account.';
    case ErrorCode.ItemUnavailable:
      return 'This item is not available for purchase';
    case ErrorCode.ItemNotOwned:
      return "You don't own this item";
    case ErrorCode.AlreadyOwned:
      return 'You already own this item';
    case ErrorCode.SkuNotFound:
      return 'Requested product could not be found';
    case ErrorCode.SkuOfferMismatch:
      return 'Selected offer does not match the SKU';
    case ErrorCode.DeferredPayment:
      return 'Payment is pending approval';
    case ErrorCode.NotPrepared:
      return 'In-app purchase is not ready. Please try again later.';
    case ErrorCode.ServiceError:
      return 'Store service error. Please try again later.';
    case ErrorCode.FeatureNotSupported:
      return 'This feature is not supported on this device.';
    case ErrorCode.TransactionValidationFailed:
      return 'Transaction could not be verified';
    case ErrorCode.ReceiptFailed:
      return 'Receipt processing failed';
    case ErrorCode.EmptySkuList:
      return 'No product IDs provided';
    case ErrorCode.InitConnection:
      return 'Failed to initialize billing connection';
    case ErrorCode.IapNotAvailable:
      return 'In-app purchases are not available on this device';
    case ErrorCode.QueryProduct:
      return 'Failed to query products. Please try again later.';
    default: {
      if (error && typeof error === 'object' && 'message' in error) {
        return (
          (error as {message?: string}).message ??
          'An unexpected error occurred'
        );
      }
      return 'An unexpected error occurred';
    }
  }
}

export const normalizeErrorCodeFromNative = (code: unknown): ErrorCode => {
  if (typeof code === 'string') {
    const upper = code.toUpperCase();

    // Check aliases first
    const alias = ERROR_CODE_ALIASES[upper];
    if (alias) {
      return alias;
    }

    // Handle various user cancelled formats
    if (
      upper === 'USER_CANCELLED' ||
      upper === 'USER_CANCELED' ||
      upper === 'E_USER_CANCELLED' ||
      upper === 'E_USER_CANCELED' ||
      upper === 'USER_CANCEL' ||
      upper === 'CANCELLED' ||
      upper === 'CANCELED' ||
      code === 'user-cancelled' ||
      code === 'user-canceled'
    ) {
      return ErrorCode.UserCancelled;
    }

    // Handle E_ prefixed codes
    if (upper.startsWith('E_')) {
      const trimmed = upper.slice(2);
      // Try direct match first
      if ((ErrorCode as any)[trimmed]) {
        return (ErrorCode as any)[trimmed];
      }

      // Try camelCase conversion
      const camel = trimmed
        .toLowerCase()
        .split('_')
        .map((segment) => {
          if (!segment) return segment;
          return segment.charAt(0).toUpperCase() + segment.slice(1);
        })
        .join('');
      if ((ErrorCode as any)[camel]) {
        return (ErrorCode as any)[camel];
      }

      // Try kebab-case conversion
      const kebab = trimmed.toLowerCase().replace(/_/g, '-');
      if ((ErrorCode as any)[kebab]) {
        return (ErrorCode as any)[kebab];
      }
    }

    // Handle direct kebab-case codes
    if (code.includes('-')) {
      if ((ErrorCode as any)[code]) {
        return (ErrorCode as any)[code];
      }
    }

    // Handle snake_case codes
    if (code.includes('_')) {
      const camel = code
        .toLowerCase()
        .split('_')
        .map((segment) => {
          if (!segment) return segment;
          return segment.charAt(0).toUpperCase() + segment.slice(1);
        })
        .join('');
      if ((ErrorCode as any)[camel]) {
        return (ErrorCode as any)[camel];
      }

      const kebab = code.toLowerCase().replace(/_/g, '-');
      if ((ErrorCode as any)[kebab]) {
        return (ErrorCode as any)[kebab];
      }
    }

    // Try direct match with ErrorCode enum
    if ((ErrorCode as any)[code]) {
      return (ErrorCode as any)[code];
    }

    // Try uppercase match
    if ((ErrorCode as any)[upper]) {
      return (ErrorCode as any)[upper];
    }
  }

  return ErrorCode.Unknown;
};
