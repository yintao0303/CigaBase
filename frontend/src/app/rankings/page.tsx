"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getMostPopular, getTopRated, filterProducts } from "@/lib/data";
import { CigaretteProduct } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Flame, Trophy, ArrowUpRight, Cigarette, TrendingUp, Medal } from "lucide-react";

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

function RankingItem({ product, rank }: { product: CigaretteProduct; rank: number }) {
  // 1=金, 2=银, 3=铜, others=灰
  const rankStyles = [
    "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-lg shadow-yellow-500/20", // gold
    "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-lg shadow-slate-400/20",     // silver
    "bg-gradient-to-br from-orange-400 to-amber-600 text-orange-900 shadow-lg shadow-orange-500/20",   // bronze
  ];
  const rankStyle = rank <= 3 ? rankStyles[rank - 1] : "bg-zinc-800 text-zinc-500";

  return (
    <Link href={`/product/${product.id}`}>
      <div className="group flex items-center gap-4 p-3 bg-zinc-900/30 hover:bg-zinc-900/80 rounded-2xl border border-zinc-800/30 hover:border-amber-500/20 transition-all duration-300 cursor-pointer">
        {/* Rank Number - far left */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${rankStyle}`}>
          {rank <= 3 ? <Medal className="w-4 h-4" /> : rank}
        </div>

        {/* Thumbnail - with hover preview */}
        {product.coverpic_thumb120x90 ? (
          <div className="w-16 h-12 shrink-0 relative group/img">
            <div className="w-full h-full rounded-lg overflow-hidden bg-zinc-800">
              <img src={product.coverpic_thumb120x90} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            {product.coverpic_thumb400x300 && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover/img:block z-50 pointer-events-none">
                <div className="w-80 rounded-xl overflow-hidden border border-zinc-600 shadow-2xl">
                  <img src={product.coverpic_thumb400x300} alt="" className="w-full object-cover" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-16 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <Cigarette className="w-5 h-5 text-zinc-600" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-500 mb-0.5">{product.brand_name}</p>
          <h3 className="text-sm font-semibold text-zinc-200 truncate group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {product.type && <Badge className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-400 hover:bg-zinc-800">{product.type}</Badge>}
            {product.tar && <Badge className="text-[10px] px-1.5 py-0 bg-zinc-800 text-zinc-400 hover:bg-zinc-800">{product.tar}</Badge>}
            {product.cigarette_type && <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400/80 hover:bg-amber-500/10">{product.cigarette_type}</Badge>}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <span className="text-base font-bold text-amber-400 block">{product.price_per_box || "—"}</span>
          <span className="text-[10px] text-zinc-600">{product.price_per_carton}/条</span>
        </div>

        {/* Rating */}
        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-sm font-bold text-zinc-300">{product.rating_overall.toFixed(1)}</div>
          <StarRating rating={product.rating_overall} />
          <span className="text-[10px] text-zinc-600">{product.comment_count} 评论</span>
        </div>

        <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0 hidden sm:block" />
      </div>
    </Link>
  );
}

function RankingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "popular";
  const [activeTab, setActiveTab] = useState(initialTab);
  const popular = getMostPopular(20);
  const topRated = getTopRated(20);
  const lowTar = filterProducts({ tarMax: "8", sortBy: "rating" }).slice(0, 20);
  const budget = filterProducts({ priceRange: "0-20", sortBy: "rating" }).slice(0, 20);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">排行榜</h1>
          <p className="text-zinc-500 text-sm">探索热门、高分与精选香烟</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900/50 border border-zinc-800/50 p-1 rounded-xl mb-8">
          <TabsTrigger value="popular" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 rounded-lg gap-2">
            <Flame className="w-4 h-4" /> 热门排行
          </TabsTrigger>
          <TabsTrigger value="rated" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 rounded-lg gap-2">
            <Star className="w-4 h-4" /> 高分排行
          </TabsTrigger>
          <TabsTrigger value="lowtar" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 rounded-lg gap-2">
            <Cigarette className="w-4 h-4" /> 低焦油榜
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 rounded-lg gap-2">
            <TrendingUp className="w-4 h-4" /> 实惠好烟
          </TabsTrigger>
        </TabsList>

        <TabsContent value="popular">
          <div className="space-y-2">
            {popular.map((product, i) => <RankingItem key={product.id} product={product} rank={i + 1} />)}
          </div>
        </TabsContent>
        <TabsContent value="rated">
          <div className="space-y-2">
            {topRated.map((product, i) => <RankingItem key={product.id} product={product} rank={i + 1} />)}
          </div>
        </TabsContent>
        <TabsContent value="lowtar">
          <div className="space-y-2">
            {lowTar.map((product, i) => <RankingItem key={product.id} product={product} rank={i + 1} />)}
          </div>
        </TabsContent>
        <TabsContent value="budget">
          <div className="space-y-2">
            {budget.map((product, i) => <RankingItem key={product.id} product={product} rank={i + 1} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function RankingsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-20 text-center text-zinc-500">加载中...</div>}>
      <RankingsContent />
    </Suspense>
  );
}
