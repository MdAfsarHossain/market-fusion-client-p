import type { Meta } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v2";

export const TOKEN_KEY = "mf_access_token";
export const USER_KEY = "mf_user";

export type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message?: string;
  meta?: Meta;
  data: T;
};

// Thrown for every non 2xx reply so callers can show the server's own message
export class ApiError extends Error {
  status: number;
  fieldErrors: { path: string; message: string }[];

  constructor(
    message: string,
    status: number,
    fieldErrors: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  // Set on server components, which have no localStorage to read from
  token?: string | null;
  query?: Record<string, string | number | undefined | null>;
  cache?: RequestCache;
  revalidate?: number;
};

const buildUrl = (
  path: string,
  query?: Record<string, string | number | undefined | null>,
) => {
  const url = new URL(
    API_BASE_URL.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`),
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  const { method = "GET", body, query, cache, revalidate } = options;
  const token = options.token !== undefined ? options.token : getToken();

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(cache ? { cache } : {}),
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Please check your connection and try again.",
      0,
    );
  }

  let payload: Record<string, unknown> | null = null;

  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const raw = (payload?.errorMessages as { path: string; message: string }[]) || [];
    throw new ApiError(
      (payload?.message as string) || "Something went wrong. Please try again.",
      response.status,
      raw.filter((item) => item.path),
    );
  }

  return payload as ApiResponse<T>;
};

// Multipart variant for endpoints that accept files. The backend's
// parseBodyData middleware reads the JSON payload from a `bodyData` field, so
// files and a normal body can travel in the same request.
export const apiUpload = async <T>(
  path: string,
  {
    method = "POST",
    body,
    files,
  }: {
    method?: "POST" | "PATCH";
    body?: Record<string, unknown>;
    files?: Record<string, File | File[] | undefined>;
  },
): Promise<ApiResponse<T>> => {
  const formData = new FormData();

  if (body) {
    formData.append("bodyData", JSON.stringify(body));
  }

  Object.entries(files || {}).forEach(([field, value]) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((file) => formData.append(field, file));
    } else {
      formData.append(field, value);
    }
  });

  const token = getToken();
  let response: Response;

  try {
    // Content-Type is deliberately unset so the browser adds the boundary
    response = await fetch(buildUrl(path), {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Please check your connection and try again.",
      0,
    );
  }

  let payload: Record<string, unknown> | null = null;

  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const raw = (payload?.errorMessages as { path: string; message: string }[]) || [];
    throw new ApiError(
      (payload?.message as string) || "Something went wrong. Please try again.",
      response.status,
      raw.filter((item) => item.path),
    );
  }

  return payload as ApiResponse<T>;
};

// Convenience helpers so call sites read as intent, not plumbing
export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  remove: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
