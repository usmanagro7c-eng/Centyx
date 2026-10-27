import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  erpnext: {
    baseUrl: process.env.ERPNEXT_URL || "http://192.168.90.103",
    apiKey: process.env.ERPNEXT_API_KEY || "",
    apiSecret: process.env.ERPNEXT_API_SECRET || "",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

export function getERPNextAuthHeader(): Record<string, string> {
  if (!config.erpnext.apiKey || !config.erpnext.apiSecret) {
    console.error(
      "ERPNext API credentials are missing. Set ERPNEXT_API_KEY and ERPNEXT_API_SECRET in backend/.env."
    );
    return {};
  }

  return {
    Authorization: `token ${config.erpnext.apiKey}:${config.erpnext.apiSecret}`,
  };
}
