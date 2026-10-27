import { api } from "./client";

export type CustomerType = "portal" | "direct";
export type CustomerStatus = "active" | "inactive";

export interface BackendCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: number;
  updatedAt?: number;
  lastOrderAt?: number;
  type: CustomerType;
  status: CustomerStatus;
  userId?: string;
}

export async function getCustomers(params: { type?: CustomerType; search?: string } = {}) {
  const response = await api.get<{ data: BackendCustomer[]; total_count?: number }>("/customers", { params });
  const payload = response.data as any;
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return {
    data: rows as BackendCustomer[],
    total_count: payload?.total_count ?? rows.length,
  };
}