 


import axios, {
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";
import {
  config,
  getERPNextAuthHeader,
} from "../config/erpnext.config.js";

export class ERPNextService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.erpnext.baseUrl,
      withCredentials: true,

      // Do NOT set Content-Type or Expect globally.
      // GET requests do not need either of them.
      headers: {
        Accept: "application/json",
      },

      maxContentLength: 2 * 1024 * 1024,
      maxBodyLength: 2 * 1024 * 1024,
      timeout: 15000,
    });
  }

  /**
   * Build headers for each request.
   *
   * If a logged-in user's Frappe cookie is available,
   * forward that cookie directly.
   *
   * Otherwise use configured ERPNext API credentials.
   */
  private getHeaders(
    customHeaders?: Record<string, string>,
    includeJsonContentType = false,
    options?: { useServiceAccount?: boolean }
  ): Record<string, string> {
    const userCookie =
      customHeaders?.userCookie ||
      customHeaders?.cookie ||
      customHeaders?.Cookie;

    const headers: Record<string, string> = {
      Accept: "application/json",
      Connection: "close",
    };

    if (includeJsonContentType && !customHeaders?.["Content-Type"] && !customHeaders?.["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (customHeaders?.["Content-Type"] || customHeaders?.["content-type"]) {
      headers["Content-Type"] = customHeaders["Content-Type"] || customHeaders["content-type"];
    }

    if (userCookie) {
      headers["Cookie"] = userCookie;
    } else if (options?.useServiceAccount) {
      Object.assign(headers, getERPNextAuthHeader());
    }

    return headers;
  }

  /**
   * Normalize query params so Express query parameters
   * are passed to Axios without being dropped.
   */
  private normalizeParams(
    params?: Record<string, any>
  ): Record<string, any> | undefined {
    if (!params) {
      return undefined;
    }

    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      normalized[key] = value;
    }

    return normalized;
  }

  /**
   * Fetch resources from ERPNext.
   *
   * GET /api/resource/:doctype
   */
  async getResource<T = any>(
  doctype: string,
  params?: {
    fields?: string[];
    filters?: any[];
    limit_page_length?: number;
    limit_start?: number;
    order_by?: string;
  },
  headers?: Record<string, string>,
    options?: { useServiceAccount?: boolean }
): Promise<{ data: T[]; total_count?: number }> {
  const formattedParams: Record<string, any> = {};

  if (params?.fields) {
    formattedParams.fields = JSON.stringify(params.fields);
  }

  if (params?.filters) {
    formattedParams.filters = JSON.stringify(params.filters);
  }

  if (params?.limit_page_length !== undefined) {
    formattedParams.limit_page_length =
      params.limit_page_length;
  }

  if (params?.limit_start !== undefined) {
    formattedParams.limit_start =
      params.limit_start;
  }

  if (params?.order_by) {
    formattedParams.order_by =
      params.order_by;
  }

  const finalHeaders = this.getHeaders(headers, false, options);

  console.log(
    "=== ERPNext GET REQUEST ===",
    {
      url: `/api/resource/${encodeURIComponent(doctype)}`,
      params: formattedParams,
      hasCookie: !!finalHeaders.Cookie,
      hasAuth: !!finalHeaders.Authorization,
    }
  );

  try {
    const response = await this.client.get(
      `/api/resource/${encodeURIComponent(doctype)}`,
      {
        params: formattedParams,
        headers: finalHeaders,
      }
    );

    console.log(
      "=== ERPNext GET RESPONSE ===",
      {
        doctype,
        status: response.status,
        firstItemKeys:
          response.data?.data?.[0]
            ? Object.keys(response.data.data[0])
            : [],
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "=== ERPNext GET ERROR ===",
      {
        doctype,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        params: error?.config?.params,
        headers: {
          accept: error?.config?.headers?.Accept,
          contentType:
            error?.config?.headers?.["Content-Type"],
          expect:
            error?.config?.headers?.Expect,
          hasCookie:
            !!error?.config?.headers?.Cookie,
          hasAuthorization:
            !!error?.config?.headers?.Authorization,
        },
      }
    );

    throw error;
  }
}
  /**
   * Get single resource detail.
   *
   * GET /api/resource/:doctype/:name
   */
  async getResourceByName<T = any>(
    doctype: string,
    name: string,
    headers?: Record<string, string>,
    options?: { useServiceAccount?: boolean }
  ): Promise<{ data: T }> {
    const finalHeaders =
      this.getHeaders(headers, false, options);

    console.log(
      "=== ERPNextService.getResourceByName Request ===",
      {
        doctype,
        name,
      }
    );

    const response = await this.client.get(
      `/api/resource/${encodeURIComponent(
        doctype
      )}/${encodeURIComponent(name)}`,
      {
        headers: finalHeaders,
      }
    );

    console.log(
      "=== ERPNextService.getResourceByName Response ===",
      {
        doctype,
        name,
        statusCode: response.status,
        keys: response.data?.data
          ? Object.keys(response.data.data)
          : [],
      }
    );

    return response.data;
  }

  /**
   * Create resource.
   *
   * POST /api/resource/:doctype
   */
  async createResource<T = any>(
    doctype: string,
    payload: Record<string, any>,
    headers?: Record<string, string>,
    options?: { useServiceAccount?: boolean }
  ): Promise<{ data: T }> {
    const finalHeaders =
      this.getHeaders(headers, true, options);
    finalHeaders.Connection = "close";

    const response = await this.client.post(
      `/api/resource/${encodeURIComponent(
        doctype
      )}`,
      payload,
      {
        headers: finalHeaders,
      }
    );

    return response.data;
  }

  /**
   * Update resource.
   *
   * PUT /api/resource/:doctype/:name
   */
  async updateResource<T = any>(
    doctype: string,
    name: string,
    payload: Record<string, any>,
    headers?: Record<string, string>,
    options?: { useServiceAccount?: boolean }
  ): Promise<{ data: T }> {
    const finalHeaders =
      this.getHeaders(headers, true, options);
    finalHeaders.Connection = "close";

    const response = await this.client.put(
      `/api/resource/${encodeURIComponent(
        doctype
      )}/${encodeURIComponent(name)}`,
      payload,
      {
        headers: finalHeaders,
      }
    );

    return response.data;
  }

  /**
   * Delete resource.
   *
   * DELETE /api/resource/:doctype/:name
   */
  async deleteResource(
    doctype: string,
    name: string,
    headers?: Record<string, string>,
    options?: { useServiceAccount?: boolean }
  ): Promise<any> {
    const finalHeaders =
      this.getHeaders(headers, false, options);

    const response = await this.client.delete(
      `/api/resource/${encodeURIComponent(
        doctype
      )}/${encodeURIComponent(name)}`,
      {
        headers: finalHeaders,
      }
    );

    return response.data;
  }

  /**
   * Execute Frappe RPC method.
   *
   * GET or POST /api/method/:methodName
   */
  async callMethod<T = any>(
    methodName: string,
    data?: any,
    httpMethod: "GET" | "POST" = "POST",
    headers?: Record<string, string>,
    options?: { useServiceAccount?: boolean }
  ): Promise<T> {
    if (httpMethod === "GET") {
      const finalHeaders =
        this.getHeaders(headers, false, options);
      finalHeaders.Connection = "close";

      const response =
        await this.client.get(
          `/api/method/${methodName}`,
          {
            params: data,
            headers: finalHeaders,
          }
        );

      return response.data;
    }

    const finalHeaders =
      this.getHeaders(headers, true, options);
    finalHeaders.Connection = "close";

    const response =
      await this.client.post(
        `/api/method/${methodName}`,
        data,
        {
          headers: finalHeaders,
        }
      );

    return response.data;
  }

  /**
   * Proxy arbitrary requests directly to ERPNext.
   *
   * Used by:
   * /api/resource/*
   * /api/method/*
   */
  async proxyRequest(
    method: string,
    urlPath: string,
    data?: any,
    params?: any,
    headers?: Record<string, string>,
    options?: { useServiceAccount?: boolean }
  ) {
    const normalizedParams =
      this.normalizeParams(params);

    const upperMethod =
      method.toUpperCase();

    const isBodyMethod =
      upperMethod === "POST" ||
      upperMethod === "PUT" ||
      upperMethod === "PATCH";

    const finalHeaders =
      this.getHeaders(
        headers,
        isBodyMethod,
        options
      );
    finalHeaders.Connection = "close";

    console.log(
      "=== ERPNextService.proxyRequest ===",
      {
        method: upperMethod,
        urlPath,
        params: normalizedParams,
        hasCookie: !!finalHeaders.Cookie,
        hasAuth:
          !!finalHeaders.Authorization,
      }
    );

    if (
      urlPath.includes("/resource/Sales%20Invoice") ||
      urlPath.includes("/resource/Sales Invoice")
    ) {
      console.log(
        "=== SALES INVOICE REQUEST DEBUG ===",
        {
          method: upperMethod,
          urlPath,
          params: normalizedParams,
        }
      );
    }

    const response =
      await this.client.request({
        method: upperMethod,
        url: urlPath,
        ...(isBodyMethod ? { data } : {}),
        params: normalizedParams,
        headers: finalHeaders,
      });

    console.log(
      "=== ERPNextService.proxyRequest response ===",
      {
        urlPath,
        statusCode: response.status,
        responseCount:
          response.data?.data?.length ?? 0,
        firstItemKeys:
          response.data?.data?.[0]
            ? Object.keys(
                response.data.data[0]
              )
            : [],
        firstItem:
          response.data?.data?.[0] ?? null,
      }
    );

    return response;
  }
}

export const erpnextService =
  new ERPNextService();