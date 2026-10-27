import axios, { type AxiosRequestConfig } from "axios";

function isDirectERPNextHostRequest(config: AxiosRequestConfig) {
  const target = config.url ?? config.baseURL;
  if (!target || typeof target !== "string") return false;

  try {
    const parsed = new URL(target, window.location.origin);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.includes("erpnext")) return true;
    return parsed.origin !== window.location.origin && parsed.protocol.startsWith("http");
  } catch {
    return false;
  }
}

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  if (isDirectERPNextHostRequest(config)) {
    throw new Error(
      "Frontend requests must not contact ERPNext directly. Use the backend /api proxy instead."
    );
  }
  return config;
});