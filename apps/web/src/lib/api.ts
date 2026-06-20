export interface ApiError {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://shopee-product-research-api.indiehomesungairaya.workers.dev/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });
  if (!response.ok) {
    let errorBody: ApiError | null = null;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // ignore parse errors
    }
    if (errorBody?.error) {
      throw new ApiClientError(
        response.status,
        errorBody.error.code,
        errorBody.error.message,
        errorBody.error.details
      );
    }
    throw new ApiClientError(
      response.status,
      "UNKNOWN_ERROR",
      `Request failed with status ${response.status}`,
      null
    );
  }
  return (await response.json()) as T;
}
