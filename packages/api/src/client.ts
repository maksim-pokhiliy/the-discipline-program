interface ApiClientConfig {
  baseUrl: string;
}

class ApiClient {
  private baseUrl: string;

  constructor({ baseUrl }: ApiClientConfig) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: unknown,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let fullUrl = `${this.baseUrl}${url}`;

    if (queryParams) {
      const params = new URLSearchParams(queryParams).toString();

      if (params) {
        fullUrl += `?${params}`;
      }
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }
}

export default ApiClient;
