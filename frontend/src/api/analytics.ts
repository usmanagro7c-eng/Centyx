import { api } from "./client";

export interface AnalyticsData {
  revenue: number;
  previousRevenue: number;
  revenueGrowth: number;
  orders: number;
  previousOrders: number;
  ordersGrowth: number;
  customers: number;
  previousCustomers: number;
  customersGrowth: number;
  averageOrderValue: number;
  dailyRevenue: Array<{ date: string; value: number }>;
  channels: Array<{ name: string; value: number; pct: number }>;
  topProducts: Array<{ name: string; qty: number; orders: number; revenue: number }>;
  invoiceCount: number;
  orderCount: number;
  refundAmount: number;
  returnedOrders: number;
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  repeatPurchaseRate: number;
  orderStatusCounts: Record<string, number>;
  payment: {
    available: boolean;
    paid: number;
    unpaid: number;
    methods: Array<{ name: string; value: number }>;
  };
  trafficAttributionAvailable: boolean;
}

export async function getAnalytics(params: { from: string; to: string; previousFrom: string; previousTo: string }) {
  const response = await api.get<{ data: AnalyticsData }>("/analytics", {
    params: {
      from: params.from,
      to: params.to,
      previous_from: params.previousFrom,
      previous_to: params.previousTo,
    },
  });
  return response.data.data;
}