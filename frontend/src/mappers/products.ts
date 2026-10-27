import type {
  Product,
  ProductOption,
  ProductVariant,
  Category,
  Collection,
} from "@/lib/store-data-store";

import type {
  FrappeItem,
  FrappeItemGroup,
  FrappeBin,
} from "@/api/products";

/**
 * Map Item Group → Category
 */
export function mapItemGroupToCategory(
  itemGroup: FrappeItemGroup
): Category {
  return {
    id: itemGroup.name,
    name: itemGroup.item_group_name,
    handle: itemGroup.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: "",
    imageUrl: "",
    bannerUrl: "",
    iconUrl: "",
    parentId: itemGroup.parent_item_group || undefined,
    status: "Active",
    sortOrder: 0,
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Map Item Group → Collection
 */
export function mapItemGroupToCollection(
  itemGroup: FrappeItemGroup
): Collection {
  return {
    id: itemGroup.name,
    name: itemGroup.item_group_name,
    handle: itemGroup.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: "",
    imageUrl: "",
    bannerUrl: "",
    kind: "auto",
    match: "all",
    productIds: [],
    rules: [
      {
        field: "category",
        value: itemGroup.name,
      },
    ],
    status: "Active",
    sortOrder: 0,
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Map Item → Product
 */
export function mapFrappeItemToProduct(
  item: FrappeItem,
  bins: FrappeBin[] = []
): Product {
  const images = item.image ? [item.image] : [];
  const imageAlts = item.image ? [item.item_name] : [];

  const stock = bins.reduce(
    (sum, bin) => sum + (bin.actual_qty || 0),
    0
  );

  const reserved = bins.reduce(
    (sum, bin) => sum + (bin.reserved_qty || 0),
    0
  );

const attributes = item.attributes ?? [];

const options: ProductOption[] =
  attributes.length > 0
    ? [...new Set(attributes.map((a) => a.attribute))].map((name) => ({
        name,
        values: [
          ...new Set(
            attributes
              .filter((a) => a.attribute === name)
              .map((a) => a.attribute_value)
          ),
        ],
      }))
    : [];

const variants: ProductVariant[] = attributes.map((attr, index) => ({
  id: `${item.name}-${index}`,
  options: {
    [attr.attribute]: attr.attribute_value,
  },
  sku: item.item_code,
  price: item.standard_rate,
  stock,
  image: item.image,
}));

  return {
    id: item.name,
    name: item.item_name,
    handle: item.item_code.toLowerCase().replace(/[^a-z0-9]+/g, "-"),

    sku: item.item_code,
    barcode: undefined,

    price: item.standard_rate,
    compareAtPrice: undefined,
    costPerItem: item.valuation_rate ?? 0,

    category: item.item_group,
    collectionIds: [],

    brand: item.brand,
    vendor: undefined,
    productType: undefined,

    stock,
    reserved,

    trackInventory: item.is_stock_item === 1,
    lowStockThreshold: 5,
    continueSellingWhenOutOfStock: false,

    status: item.disabled ? "Archived" : "Published",

    images,
    imageAlts,
    imageUrl: item.image,

    description: item.description || "",
    shortDescription: "",

    tags: [],

    weight: item.weight_per_unit,
    dimensions: undefined,

    taxable: true,
    requiresShipping: true,
    isDigital: false,

    options,
    variants,

    seoTitle: "",
    seoDescription: "",

    featured: false,

    createdAt: new Date(item.creation).getTime(),
    updatedAt: new Date(item.modified).getTime(),
  };
}

/**
 * Batch mapper
 */
export function mapItemsToProducts(
  items: FrappeItem[],
  bins: FrappeBin[] = []
): Product[] {
  const binsByItem = bins.reduce<Record<string, FrappeBin[]>>((acc, bin) => {
    if (!acc[bin.item_code]) {
      acc[bin.item_code] = [];
    }

    acc[bin.item_code].push(bin);

    return acc;
  }, {});

  return items.map((item) =>
    mapFrappeItemToProduct(item, binsByItem[item.item_code] || [])
  );
}

export function mapItemGroupsToCategories(
  groups: FrappeItemGroup[]
): Category[] {
  return groups.map(mapItemGroupToCategory);
}

export function mapItemGroupsToCollections(
  groups: FrappeItemGroup[]
): Collection[] {
  return groups.map(mapItemGroupToCollection);
}