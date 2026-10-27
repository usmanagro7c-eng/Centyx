import { api } from "./client";

export interface WebsiteStore {
  name: string;
  title: string;
  slug: string;
  route?: string;
  owner: string;
  creation?: string;
  modified?: string;
  published?: boolean;
  [key: string]: any;
}

export async function getMyStores(): Promise<WebsiteStore[]> {
  try {
    console.log("=== getMyStores: Calling /my-stores ===");
    const response = await api.get<{ data: WebsiteStore[] }>('/my-stores');
    console.log("=== getMyStores: Response received ===", { response, data: response.data });

    const stores = response.data.data || [];
    return stores.map((store: any) => ({
      ...store,
      slug: store.slug || store.route || store.name,
      route: store.route || store.slug || store.name,
      title: store.title || store.name,
    }));
  } catch (error: any) {
    console.error("=== getMyStores: ERROR ===", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error,
    });
    return [];
  }
}

export async function createWebsite(data: {
  title: string;
  slug?: string;
}): Promise<WebsiteStore> {
  try {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "website";

    const response = await api.post<{ data: WebsiteStore }>('/my-stores', {
      title: data.title,
      slug,
      route: slug,
    });

    const created = response.data.data;
    return {
      ...created,
      slug: created.slug || created.route || slug,
      route: created.route || created.slug || slug,
      title: created.title || data.title,
    };
  } catch (error) {
    console.error("Failed to create website:", error);
    throw error;
  }
}

export async function updateWebsite(
  name: string,
  data: Record<string, any>
): Promise<WebsiteStore> {
  try {
    const response = await api.put<{ data: WebsiteStore }>(`/resource/Web Page/${encodeURIComponent(name)}`, data);
    return response.data.data;
  } catch (error) {
    console.error("Failed to update website:", error);
    throw error;
  }
}

export async function deleteWebsite(name: string): Promise<void> {
  try {
    await api.delete(`/resource/Web Page/${encodeURIComponent(name)}`);
  } catch (error) {
    console.error("Failed to delete website:", error);
    throw error;
  }
}
