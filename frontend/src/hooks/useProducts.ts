import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getItemGroups,
  getProductBin,
  getAllProductBins,
  deleteProduct as deleteProductApi,
  type GetProductsParams,
  type FrappeBin,
  type FrappeItemGroup,
} from "@/api/products";

import {
  mapItemsToProducts,
  mapItemGroupsToCategories,
  mapItemGroupsToCollections,
} from "@/mappers/products";

import { useAuthStore } from "@/lib/auth-store";

/**
 * Products
 */
export function useProducts(params: GetProductsParams = {}) {
  return useQuery<{
    data: Product[];
    total: number;
    page: number;
    pageLength: number;
  }>({
    queryKey: ["products", params],
    staleTime: 60_000,

    queryFn: async () => {
      const response = await getProducts(params);

      const items = response ?? [];

      const products = mapItemsToProducts(items);

      return {
        data: products,
        total: products.length,
        page:
          Math.floor(
            (params.limit_start ?? 0) /
              (params.limit_page_length ?? 20)
          ) + 1,
        pageLength: params.limit_page_length ?? 20,
      };
    },

    placeholderData: (previous) => previous,
  });
}

/**
 * Item Groups
 */
export function useItemGroups() {
  return useQuery<FrappeItemGroup[]>({
    queryKey: ["item-groups"],

    queryFn: async () => {
      const response = await getItemGroups();
      return response;
    },
  });
}

/**
 * Categories
 */
export function useCategories() {
  const { data = [], ...rest } = useItemGroups();

  return {
    ...rest,
    data: mapItemGroupsToCategories(data),
  };
}

/**
 * Collections
 */
export function useCollections() {
  const { data = [], ...rest } = useItemGroups();

  return {
    ...rest,
    data: mapItemGroupsToCollections(data),
  };
}

/**
 * Product Inventory
 */
export function useProductInventory(
  itemCode: string,
  warehouse?: string
) {
  return useQuery({
    queryKey: ["product-bin", itemCode, warehouse],
    queryFn: () => getProductBin(itemCode, warehouse),
    enabled: !!itemCode,
  });
}

/**
 * All Bins
 */
export function useAllBins() {
  return useQuery<FrappeBin[]>({
    queryKey: ["all-bins"],
    queryFn: getAllProductBins,
  });
}

/**
 * Products With Inventory
 */
export function useProductsWithInventory() {
  const authUser = useAuthStore.getState().user;
  const {
    data: productResponse,
    ...productsQuery
  } = useProducts({
    limit_page_length: 500,
    include_cost: !!authUser,
    filters: {
      disabled: 0,
    },
  });

  const {
    data: bins = [],
    isLoading: binsLoading,
    isError: binsError,
  } = useAllBins();

  const products: Product[] = productResponse?.data ?? [];

  const productsWithInventory = products.map((product) => {
    const productBins = bins.filter(
      (bin) => bin.item_code === product.sku
    );

    const stock = productBins.reduce(
      (sum, bin) => sum + bin.actual_qty,
      0
    );

    const reserved = productBins.reduce(
      (sum, bin) => sum + bin.reserved_qty,
      0
    );

    return {
      ...product,
      stock,
      reserved,
    };
  });

  return {
    ...productsQuery,
    data: productsWithInventory,
    total: productResponse?.total ?? 0,
    page: productResponse?.page ?? 1,
    pageLength: productResponse?.pageLength ?? 20,
    isLoading: productsQuery.isLoading || binsLoading,
    isError: productsQuery.isError || binsError,
  };
}

/**
 * Inventory Page
 */
export function useAllInventory() {
  return useProductsWithInventory();
}

/**
 * Delete Product Mutation
 * Deletes from both frontend (cache) and backend (Frappe)
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemCode: string) => {
      await deleteProductApi(itemCode);
      return itemCode;
    },
    onSuccess: () => {
      // Invalidate products queries to refetch
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["item-groups"] });
      queryClient.invalidateQueries({ queryKey: ["all-bins"] });
    },
  });
}