import { api } from "./client";

export interface FrappeGiftCard {
  name: string;
  gift_card_number: string;
  customer?: string;
  customer_name?: string;
  balance: number;
  initial_balance: number;
  status: "Active" | "Used" | "Expired" | "Cancelled";
  expiry_date?: string;
  issue_date: string;
  currency: string;
  conversion_rate: number;
  company: string;
  creation: string;
  modified: string;
  owner: string;
  docstatus: number;
}

export interface FrappeGiftCardListResponse {
  data: FrappeGiftCard[];
}

export interface FrappeGiftCardSingleResponse {
  data: FrappeGiftCard;
}

export interface GetGiftCardsParams {
  fields?: string[];
  filters?: Record<string, any>;
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
}

export async function getGiftCards(params: GetGiftCardsParams = {}) {
  const defaultFields = [
    "name",
    "gift_card_number",
    "customer",
    "customer_name",
    "balance",
    "initial_balance",
    "status",
    "expiry_date",
    "issue_date",
    "currency",
    "creation",
    "modified",
  ];

  try {
    const response = await api.get<FrappeGiftCardListResponse>("/resource/Gift Card", {
      params: {
        fields: JSON.stringify(params.fields || defaultFields),
        filters: JSON.stringify(params.filters || []),
        limit_page_length: params.limit_page_length || 20,
        limit_start: params.limit_start || 0,
        order_by: params.order_by || "creation desc",
      },
    });

    return response.data;
  } catch (error: any) {
    // Handle case where Gift Card DocType doesn't exist
    if (error.response?.status === 404 || error.response?.data?.message?.includes("Gift Card")) {
      throw new Error("GIFT_CARD_DOCTYPE_NOT_FOUND");
    }
    throw error;
  }
}

export async function getGiftCardById(giftCardName: string) {
  try {
    const response = await api.get<FrappeGiftCardSingleResponse>(`/resource/Gift Card/${giftCardName}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.data?.message?.includes("Gift Card")) {
      throw new Error("GIFT_CARD_DOCTYPE_NOT_FOUND");
    }
    throw error;
  }
}

export async function getGiftCardsCount(filters?: Record<string, any>) {
  try {
    const response = await api.get<{ message: number }>("/method/frappe.client.get_count", {
      params: {
        doctype: "Gift Card",
        filters: JSON.stringify(filters || []),
      },
    });
    return response.data.message || 0;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error("GIFT_CARD_DOCTYPE_NOT_FOUND");
    }
    throw error;
  }
}

export function isGiftCardDocTypeNotFound(error: unknown): boolean {
  return error instanceof Error && error.message === "GIFT_CARD_DOCTYPE_NOT_FOUND";
}