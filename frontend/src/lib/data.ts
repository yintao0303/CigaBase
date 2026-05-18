import type { CigaretteProduct, Brand } from "@/lib/types";
import productsData from "@/data/products.json";
import brandsData from "@/data/brands.json";

const products: CigaretteProduct[] = productsData as CigaretteProduct[];
const brands: Brand[] = brandsData as Brand[];

export function getAllProducts(): CigaretteProduct[] {
  return products;
}

export function getProductById(id: number): CigaretteProduct | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByBrand(brandName: string): CigaretteProduct[] {
  return products.filter((p) => p.brand_name === brandName);
}

export function getBrands(): Brand[] {
  return brands;
}

export function getBrandByName(name: string): Brand | undefined {
  return brands.find((b) => b.name === name);
}

export function getBrandCoverUrl(brandName: string): string {
  // First try the brand's own coverpic (skip nopic placeholder)
  const brand = brands.find((b) => b.name === brandName);
  if (brand?.coverpic && !brand.coverpic.includes("nopic")) {
    return brand.coverpic;
  }
  // Fall back to a product's cover image
  const product = products.find((p) => p.brand_name === brandName && p.coverpic_thumb400x300);
  return product?.coverpic_thumb400x300 || "";
}

function isValidCoverUrl(url: string): boolean {
  return !!url && !url.includes("nopic");
}

export function getBrandsByRegion(region: string): Brand[] {
  return brands.filter((b) => b.region === region);
}
export function getRegionGroups(): Map<string, Brand[]> {
  const map = new Map<string, Brand[]>();
  for (const b of brands) {
    const r = b.region || "其他";
    if (!map.has(r)) map.set(r, []);
    map.get(r)!.push(b);
  }
  return map;
}

export function searchProducts(query: string, limit = 50): CigaretteProduct[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return products
    .filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.cigarette_type && p.cigarette_type.toLowerCase().includes(q)) ||
        (p.barcode_box && p.barcode_box.includes(q))
    )
    .slice(0, limit);
}

export function getTopRated(limit = 10, minRatings = 10): CigaretteProduct[] {
  return [...products]
    .filter((p) => p.rating_count >= minRatings && p.rating_overall > 0)
    .sort((a, b) => b.rating_overall - a.rating_overall)
    .slice(0, limit);
}

export function getMostPopular(limit = 10): CigaretteProduct[] {
  return [...products]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

export function getProductsByPriceRange(min: number, max: number): CigaretteProduct[] {
  return products.filter((p) => {
    const raw = p.packprice_raw || parseInt(p.price_per_box) || 0;
    return raw >= min && raw <= max;
  });
}

export function getProductsByTar(maxTar: number): CigaretteProduct[] {
  return products.filter((p) => {
    const tar = p.packprice_raw ? 0 : parseInt(p.tar) || 0;
    const rawTar = parseInt(p.tar) || 0;
    return rawTar > 0 && rawTar <= maxTar;
  });
}

export function filterProducts(filters: {
  brand?: string;
  type?: string;
  tarMax?: string;
  priceRange?: string;
  sortBy?: string;
}): CigaretteProduct[] {
  let result = [...products];

  if (filters.brand) {
    result = result.filter((p) => p.brand_name === filters.brand);
  }
  if (filters.type) {
    result = result.filter((p) => p.cigarette_type.includes(filters.type!));
  }
  if (filters.tarMax && filters.tarMax !== "all") {
    const max = parseInt(filters.tarMax);
    result = result.filter((p) => {
      const tar = parseInt(p.tar);
      return !isNaN(tar) && tar > 0 && tar <= max;
    });
  }
  if (filters.priceRange && filters.priceRange !== "all") {
    const [min, max] = filters.priceRange.split("-").map(Number);
    result = result.filter((p) => {
      const raw = p.packprice_raw || parseInt(p.price_per_box) || 0;
      const price = raw > 1000 ? raw / 10 : raw; // Normalize
      if (!isNaN(min) && !isNaN(max)) return price >= min && price <= max;
      if (!isNaN(min)) return price >= min;
      return true;
    });
  }

  switch (filters.sortBy) {
    case "rating":
      result.sort((a, b) => b.rating_overall - a.rating_overall);
      break;
    case "popularity":
      result.sort((a, b) => b.popularity - a.popularity);
      break;
    case "price-asc":
      result.sort((a, b) => {
        const pa = a.packprice_raw || parseInt(a.price_per_box) || 0;
        const pb = b.packprice_raw || parseInt(b.price_per_box) || 0;
        return pa - pb;
      });
      break;
    case "price-desc":
      result.sort((a, b) => {
        const pa = a.packprice_raw || parseInt(a.price_per_box) || 0;
        const pb = b.packprice_raw || parseInt(b.price_per_box) || 0;
        return pb - pa;
      });
      break;
  }

  return result;
}

export function getStats() {
  const totalProducts = products.length;
  const totalBrands = brands.length;
  const avgRating =
    products.filter((p) => p.rating_overall > 0).reduce((sum, p) => sum + p.rating_overall, 0) /
    Math.max(1, products.filter((p) => p.rating_overall > 0).length);
  const totalRatings = products.reduce((sum, p) => sum + p.rating_count, 0);

  return {
    totalProducts,
    totalBrands,
    avgRating: avgRating.toFixed(1),
    totalRatings,
  };
}
