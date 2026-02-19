import getErrorMessage from "./isErrorInString";

/**
 * Constructs and throws a formatted Error from multiple error sources,
 * prioritizing in order: local error → response error → fallback message.
 *
 * @param error - A local/state-level error string or unknown thrown value
 * @param resError - A response/API-level error (string, Error, or unknown object)
 * @param fallbackMessage - Last resort message if no valid error is found
 * @throws {Error} Always throws — return type is `never`
 *
 * @example
 * throwFormattedError("", "Email already exists.")
 * // throws Error("Email already exists.")
 *
 * throwFormattedError("", new Error("Token expired"))
 * // throws Error("Token expired")
 *
 * throwFormattedError("", { message: "Not found" })
 * // throws Error("Not found")
 *
 * throwFormattedError("", "")
 * // throws Error("Internal server error.")
 */
export const throwFormattedError = (
  error: unknown = "",
  resError: unknown = "",
  fallbackMessage: string = "Internal server error."
): never => {
  // Resolve resError — handle string, Error instance, or { message } shape
  const resolvedResError =
    resError instanceof Error
      ? resError.message
      : typeof resError === "object" && resError !== null && "message" in resError
        ? String((resError as { message: unknown }).message)
        : resError;

  const message =
    getErrorMessage(error, "") ||
    getErrorMessage(resolvedResError, "") ||
    fallbackMessage;

  throw new Error(message);
};