"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrands, getRegionGroups, getBrandCoverUrl } from "@/lib/data";
import { Brand } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Package, ArrowUpRight, Search, Globe, MapPin, ChevronDown } from "lucide-react";

const REGION_ICONS: Record<string, string> = {
  "大陆": "🇨🇳",
  "国外": "🌍",
  "港澳台": "🏙️",
  "古巴": "🇨🇺",
  "历史品牌": "📜",
};

export default function BrandsPage() {
  const allBrands = getBrands();
  const [query, setQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("大陆");
  const regionGroups = getRegionGroups();
  const regions = Array.from(regionGroups.keys());

  // Sort: 大陆 first, then 国外, 港澳台, etc.
  const sortedRegions = regions.sort((a, b) => {
    const order = ["大陆", "国外", "港澳台", "古巴", "历史品牌", "其他"];
    return order.indexOf(a) - order.indexOf(b);
  });

  const filtered = query
    ? allBrands.filter(
        (b) => b.name.toLowerCase().includes(query.toLowerCase())
      )
    : (regionGroups.get(activeRegion) || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">品牌总览</h1>
        <p className="text-zinc-500">
          共收录 {allBrands.length} 个品牌 · {allBrands.reduce((s, b) => s + b.product_count, 0)} 款产品
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="搜索品牌名称..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-zinc-900/50 border-zinc-700 text-zinc-200 rounded-xl focus-visible:ring-amber-500/30"
        />
      </div>

      {/* Region Tabs */}
      {!query && (
        <div className="flex flex-wrap gap-2 mb-8">
          {sortedRegions.map((region) => {
            const brands = regionGroups.get(region) || [];
            const emoji = REGION_ICONS[region] || "";
            return (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeRegion === region
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5"
                    : "bg-zinc-900/50 text-zinc-400 border border-zinc-800/50 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                <span className="text-base">{emoji}</span>
                {region}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeRegion === region ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {brands.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Brand Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((brand) => (
          <Link key={brand.name} href={`/brand/${encodeURIComponent(brand.name)}`}>
            <div className="group relative bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800/50 hover:border-amber-500/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 h-full">
              {/* Brand Cover */}
              {(() => {
                const coverUrl = getBrandCoverUrl(brand.name);
                return coverUrl ? (
                  <div className="aspect-[3/2] bg-zinc-800/30 overflow-hidden">
                    <img src={coverUrl} alt={brand.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                ) : (
                  <div className="aspect-[3/2] bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center">
                    <span className="text-5xl font-bold text-zinc-700 group-hover:text-amber-500/20 transition-colors">{brand.name[0]}</span>
                  </div>
                );
              })()}

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-zinc-200 group-hover:text-amber-400 transition-colors truncate">
                      {brand.name}
                    </h3>
                    {brand.region && (
                      <p className="text-xs text-zinc-500 mt-1">{brand.region}</p>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                  <Package className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-sm font-medium text-zinc-400">
                    {brand.product_count} 款产品
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">未找到匹配的品牌</p>
        </div>
      )}
    </div>
  );
}
