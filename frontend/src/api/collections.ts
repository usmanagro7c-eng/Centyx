import { api } from "./client";

export interface FrappeItemGroup {
  name: string;
  item_group_name: string;
  is_group: number;
  parent_item_group: string;
  image?: string;
  description?: string;
  is_active: number;
  disabled: number;
  creation: string;
  modified: string;
}

export interface FrappeItemGroupListResponse {
  data: FrappeItemGroup[];
}

export interface FrappeItemGroupSingleResponse {
  data: FrappeItemGroup;
}

export async function getItemGroups(params: {
  fields?: string[];
  filters?: Record<string, any>;
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
} = {}) {
  const defaultFields = [
    "name",
    "item_group_name",
    "is_group",
    "parent_item_group",
    "image",
    "description",
    "is_active",
    "disabled",
    "creation",
    "modified",
  ];

  const response = await api.get<FrappeItemGroupListResponse>("/resource/Item Group", {
    params: {
      fields: JSON.stringify(params.fields || defaultFields),
      filters: JSON.stringify(params.filters || []),
      limit_page_length: params.limit_page_length || 100,
      limit_start: params.limit_start || 0,
      order_by: params.order_by || "lft asc",
    },
  });

  return response.data;
}

export async function getItemGroupById(groupName: string) {
  const response = await api.get<FrappeItemGroupSingleResponse>(`/resource/Item Group/${groupName}`);
  return response.data;
}

export async function getItemGroupsTree() {
  const response = await api.get<FrappeItemGroupListResponse>("/resource/Item Group", {
    params: {
      fields: JSON.stringify([
        "name",
        "item_group_name",
        "is_group",
        "parent_item_group",
        "image",
        "is_active",
        "disabled",
      ]),
      limit_page_length: 1000,
      order_by: "lft asc",
    },
  });
  return response.data;
}