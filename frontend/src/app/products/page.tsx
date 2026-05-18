"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getAllProducts, getBrands, getRegionGroups } from "@/lib/data";
import { CigaretteProduct } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search, Star, Flame, ArrowUpRight, Cigarette, Package,
  X, ChevronLeft, ChevronRight,
} from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating / 2) ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />
      ))}
      <span className="text-[10px] text-zinc-500 ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

const PAGE_SIZE = 60;

export default function ProductsPage() {
  const allProducts = getAllProducts();
  const brands = getBrands();
  const regionGroups = getRegionGroups();
  const regions = ["全部", ...Array.from(regionGroups.keys())];

  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [region, setRegion] = useState("全部");
  const [tarMax, setTarMax] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) => (p.name && p.name.toLowerCase().includes(q)) || (p.brand_name && p.brand_name.toLowerCase().includes(q))
      );
    }
    if (brand !== "all") {
      result = result.filter((p) => p.brand_name === brand);
    }
    if (region !== "全部") {
      const regionBrands = (regionGroups.get(region) || []).map(b => b.name);
      result = result.filter((p) => regionBrands.includes(p.brand_name));
    }
    if (tarMax !== "all") {
      const max = parseInt(tarMax);
      result = result.filter((p) => {
        const tar = parseInt(p.tar);
        return !isNaN(tar) && tar > 0 && tar <= max;
      });
    }
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      result = result.filter((p) => {
        const raw = p.packprice_raw || parseInt(p.price_per_box) || 0;
        const price = raw > 1000 ? raw / 10 : raw;
        if (!isNaN(min) && !isNaN(max)) return price >= min && price <= max;
        if (!isNaN(min)) return price >= min;
        return true;
      });
    }

    switch (sortBy) {
      case "rating": result.sort((a, b) => b.rating_overall - a.rating_overall); break;
      case "popularity": result.sort((a, b) => b.popularity - a.popularity); break;
      case "price-asc":
        result.sort((a, b) => (a.packprice_raw || 0) - (b.packprice_raw || 0)); break;
      case "price-desc":
        result.sort((a, b) => (b.packprice_raw || 0) - (a.packprice_raw || 0)); break;
    }
    return result;
  }, [allProducts, query, brand, region, tarMax, priceRange, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateFilter = (setter: (v: string) => void, value: string) => { setter(value); setPage(1); };
  const clearFilters = () => {
    setQuery("");
    updateFilter(setBrand, "all");
    updateFilter(setRegion, "全部");
    updateFilter(setTarMax, "all");
    updateFilter(setPriceRange, "all");
  };
  const hasFilters = query || brand !== "all" || region !== "全部" || tarMax !== "all" || priceRange !== "all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">全部产品</h1>
          <p className="text-zinc-500 text-sm">{allProducts.length.toLocaleString()} 款香烟</p>
        </div>
      </div>

      {/* Search + Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input placeholder="搜索产品名称..." value={query}
            onChange={(e) => updateFilter(setQuery, e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-700 text-zinc-200 rounded-xl focus-visible:ring-amber-500/30" />
        </div>
        <select value={sortBy} onChange={(e) => updateFilter(setSortBy, e.target.value)}
          className="px-3 h-[42px] bg-zinc-900/50 border border-zinc-700 rounded-xl text-sm text-zinc-300 shrink-0">
          <option value="popularity">🔥 热度排序</option>
          <option value="rating">⭐ 评分排序</option>
          <option value="price-asc">💰 价格从低到高</option>
          <option value="price-desc">💎 价格从高到低</option>
        </select>
      </div>

      {/* Always-visible Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/30">
        {/* Region filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">区域</span>
          <select value={region} onChange={(e) => updateFilter(setRegion, e.target.value)}
            className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300">
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Brand filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">品牌</span>
          <select value={brand} onChange={(e) => updateFilter(setBrand, e.target.value)}
            className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 max-w-[160px]">
            <option value="all">全部</option>
            {brands.slice(0, 100).map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </div>

        {/* Tar filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">焦油</span>
          <select value={tarMax} onChange={(e) => updateFilter(setTarMax, e.target.value)}
            className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300">
            <option value="all">不限</option>
            <option value="5">≤5mg</option>
            <option value="8">≤8mg</option>
            <option value="10">≤10mg</option>
            <option value="12">≤12mg</option>
          </select>
        </div>

        {/* Price filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">价格</span>
          <select value={priceRange} onChange={(e) => updateFilter(setPriceRange, e.target.value)}
            className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300">
            <option value="all">不限</option>
            <option value="5-15">5-15元</option>
            <option value="15-30">15-30元</option>
            <option value="30-60">30-60元</option>
            <option value="60-999">60元以上</option>
          </select>
        </div>

        {hasFilters && (
          <button onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-3 h-3" /> 清除
          </button>
        )}

        <span className="ml-auto text-xs text-zinc-600">{filtered.length} 结果</span>
      </div>

      <Separator className="bg-zinc-800/50 mb-4" />

      {/* Pagination info */}
      {totalPages > 1 && (
        <p className="text-xs text-zinc-600 mb-3">第 {page}/{totalPages} 页</p>
      )}

      {/* Product Grid */}
      {pagedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {pagedProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <div className="group relative bg-zinc-900/50 hover:bg-zinc-900 rounded-xl border border-zinc-800/50 hover:border-amber-500/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 h-full">
                  {product.coverpic_thumb400x300 ? (
                    <div className="aspect-[4/3] bg-zinc-800/50 overflow-hidden">
                      <img src={product.coverpic_thumb400x300} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-zinc-800/50 flex items-center justify-center">
                      <Cigarette className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-[10px] text-zinc-500 mb-0.5 truncate">{product.brand_name}</p>
                    <h3 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-amber-400 transition-colors mb-2">{product.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.type && <Badge className="text-[9px] px-1.5 py-0 bg-zinc-800 text-zinc-400 hover:bg-zinc-800">{product.type}</Badge>}
                      {product.tar && <Badge className="text-[9px] px-1.5 py-0 bg-zinc-800 text-zinc-400 hover:bg-zinc-800">{product.tar}</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-amber-400">{product.price_per_box || "—"}</span>
                      {product.rating_overall > 0 && <StarRating rating={product.rating_overall} />}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-700 text-zinc-400 hover:text-amber-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 4, totalPages - 9));
                const p = start + i;
                if (p > totalPages) return null;
                return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${page === p ? "bg-amber-500/20 text-amber-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"}`}>{p}</button>;
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-700 text-zinc-400 hover:text-amber-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">调整筛选条件试试</p>
          <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-300">清除筛选</button>
        </div>
      )}
    </div>
  );
}
