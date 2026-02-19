/**
 * Safely extracts a readable error message from an unknown value.
 * Falls back to a default message if the value is not a valid, non-empty string.
 *
 * @param value - The value to extract a message from
 * @param fallback - Fallback string if value is invalid (default: "Internal Server Error")
 * @returns A valid, trimmed error message string
 *
 * @example
 * getErrorMessage("Something went wrong") // "Something went wrong"
 * getErrorMessage("   ")                  // "Internal Server Error"
 * getErrorMessage(null)                   // "Internal Server Error"
 * getErrorMessage(404)                    // "Internal Server Error"
 * getErrorMessage(undefined, "Oops!")     // "Oops!"
 */
const getErrorMessage = (
  value: unknown,
  fallback: string = "Internal Server Error"
): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

export default getErrorMessage;