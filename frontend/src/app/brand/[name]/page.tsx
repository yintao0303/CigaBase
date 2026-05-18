"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProductsByBrand, getBrandByName, getBrandCoverUrl } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Star, Flame, ArrowLeft, ArrowUpRight, Cigarette, Package,
} from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating / 2) ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />
      ))}
      <span className="text-xs text-zinc-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const brandName = decodeURIComponent(params.name as string);
  const products = getProductsByBrand(brandName);
  const brand = getBrandByName(brandName);

  if (products.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-zinc-300 mb-2">品牌未找到</h1>
        <p className="text-zinc-500 mb-6">未找到品牌「{brandName}」的相关产品</p>
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
      </div>
    );
  }

  const brandCover = getBrandCoverUrl(brandName);
  const avgRating = products.filter(p => p.rating_overall > 0).reduce((sum, p) => sum + p.rating_overall, 0) / Math.max(1, products.filter(p => p.rating_overall > 0).length);
  const totalPopularity = products.reduce((sum, p) => sum + p.popularity, 0);
  const types = [...new Set(products.map((p) => p.type).filter(Boolean))];
  const prices = products.map(p => p.packprice_raw || parseInt(p.price_per_box) || 0).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // Cover: use brand's own (skip nopic), fallback to product image
  const showCover = brandCover;
  const hasBrandCover = brand?.coverpic && !brand.coverpic.includes("nopic");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-amber-400 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      {/* Brand Hero */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-amber-950/20 rounded-3xl border border-zinc-800/50 overflow-hidden mb-8">
        {/* Brand Cover Banner */}
        {showCover && (
          <div className="h-48 sm:h-56 bg-zinc-800/30 overflow-hidden flex items-center justify-center">
            <img src={showCover} alt={brandName} className="max-h-full max-w-full object-contain p-4" />
          </div>
        )}

        <div className="p-8 sm:p-10">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-xl shadow-amber-500/20 shrink-0">
              {brandName[0]}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">{brandName}</h1>
              {brand?.desp && <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{brand.desp}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span className="text-zinc-300 font-medium">{products.length}</span> 个产品
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-zinc-300 font-medium">{avgRating.toFixed(1)}</span> 均分
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-zinc-300 font-medium">{totalPopularity.toLocaleString()}</span> 热度
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-zinc-800/50">
            <div className="text-center p-4 bg-zinc-900/50 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">{products.length}</p>
              <p className="text-xs text-zinc-500 mt-1">收录产品</p>
            </div>
            <div className="text-center p-4 bg-zinc-900/50 rounded-xl">
              <p className="text-2xl font-bold text-zinc-200">¥{minPrice} - ¥{maxPrice}</p>
              <p className="text-xs text-zinc-500 mt-1">价格区间</p>
            </div>
            <div className="text-center p-4 bg-zinc-900/50 rounded-xl">
              <p className="text-2xl font-bold text-zinc-200">{types.length}</p>
              <p className="text-xs text-zinc-500 mt-1">产品类型</p>
            </div>
            <div className="text-center p-4 bg-zinc-900/50 rounded-xl">
              <p className="text-2xl font-bold text-zinc-200">{totalPopularity.toLocaleString()}</p>
              <p className="text-xs text-zinc-500 mt-1">总热度</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold text-zinc-100 mb-6">全部产品</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product, i) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <div className="group relative bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800/50 hover:border-amber-500/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
              {/* Product image */}
              {product.coverpic_thumb400x300 ? (
                <div className="aspect-[4/3] bg-zinc-800/50 overflow-hidden">
                  <img src={product.coverpic_thumb400x300} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-zinc-800/50 flex items-center justify-center">
                  <Cigarette className="w-8 h-8 text-zinc-600" />
                </div>
              )}

              <div className="p-5">
                {i < 3 && (
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-lg z-10">{i + 1}</div>
                )}
                <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">{product.name}</h3>
                <div className="flex flex-wrap gap-1.5 my-2">
                  {product.type && <Badge className="text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-800">{product.type}</Badge>}
                  {product.cigarette_type && <Badge className="text-[10px] bg-zinc-800 text-amber-400/80 hover:bg-zinc-800">{product.cigarette_type}</Badge>}
                  {product.tar && <Badge className="text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-800">{product.tar}</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-400">{product.price_per_box || "—"}</span>
                  {product.rating_overall > 0 && <StarRating rating={product.rating_overall} />}
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600">
                  <Flame className="w-3 h-3" />
                  <span>{product.popularity.toLocaleString()} 热度</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
