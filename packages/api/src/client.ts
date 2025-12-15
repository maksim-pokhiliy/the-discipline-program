interface ApiClientConfig {
  baseUrl: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor({ baseUrl }: ApiClientConfig) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    body?: unknown,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    const headers: Record<string, string> = {};

    let fullUrl = `${this.baseUrl}${url}`;

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (queryParams) {
      const params = new URLSearchParams(queryParams).toString();

      if (params) {
        fullUrl += `?${params}`;
      }
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: `Request failed: ${response.status}` }));

      throw new Error(error.error || `API request failed: ${response.status}`);
    }

    return response.json();
  }
}
