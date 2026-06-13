import axios from "axios";

type ErrorResponse = {
  message?: string;
};

export const getErrorMessage = (
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ErrorResponse | undefined;
    return responseData?.message ?? error.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

