"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getMostPopular, getTopRated, getBrands, getStats, searchProducts, getBrandCoverUrl } from "@/lib/data";
import { CigaretteProduct } from "@/lib/types";
import { Flame, Star, TrendingUp, ArrowUpRight, Search, Cigarette, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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

function ProductCard({ product, rank }: { product: CigaretteProduct; rank?: number }) {
  const coverImg = product.coverpic_thumb400x300 || product.coverpic_thumb120x90 || product.coverpic;
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group relative bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800/50 hover:border-amber-500/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
        {coverImg && (
          <div className="aspect-[4/3] bg-zinc-800/50 overflow-hidden">
            <img src={coverImg} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          </div>
        )}
        <div className="p-5">
          {rank && <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-lg z-10">{rank}</div>}
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0"><p className="text-xs text-zinc-500 mb-0.5">{product.brand_name}</p><h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">{product.name}</h3></div>
            <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.type && <Badge className="text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-800">{product.type}</Badge>}
            {product.cigarette_type && <Badge className="text-[10px] bg-zinc-800 text-amber-400/80 hover:bg-zinc-800">{product.cigarette_type}</Badge>}
            {product.tar && <Badge className="text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-800">{product.tar}</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1"><Cigarette className="w-3 h-3" /><span>{product.length || "—"}</span></div>
            <div className="flex items-center gap-1"><Package className="w-3 h-3" /><span>{product.packaging || "—"}</span></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-amber-400">{product.price_per_box || "—"}</span>
            {product.rating_overall > 0 && <StarRating rating={product.rating_overall} />}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600"><Flame className="w-3 h-3" /><span>{product.popularity.toLocaleString()} 热度</span><span className="mx-1">·</span><span>{product.comment_count} 评论</span></div>
        </div>
      </div>
    </Link>
  );
}

// ---- Animated text reveal ----
function AnimatedText({ text, gradient }: { text: string; gradient?: boolean }) {
  const chars = text.split("");
  return (
    <span>
      {chars.map((ch, i) => (
        <span
          key={i}
          className={`inline-block animate-char-reveal ${gradient ? "animate-color-flow" : "text-zinc-100"}`}
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

// ---- Smoke particles ----
function SmokeParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; bottom: string; delay: string; duration: string; size: string; drift: string }>>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${10 + Math.random() * 80}%`,
        bottom: `${Math.random() * 30}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${4 + Math.random() * 5}s`,
        size: `${2 + Math.random() * 4}px`,
        drift: `${-20 + Math.random() * 40}px`,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-amber-400/30 animate-smoke-rise"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            "--drift": p.drift,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ---- Scan line ----
function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent animate-scan" />
    </div>
  );
}

// ---- Brand marquee ----
function BrandMarquee({ brands }: { brands: ReturnType<typeof getBrands> }) {
  return (
    <div className="relative overflow-hidden py-3">
      <div className="flex animate-marquee gap-6 whitespace-nowrap">
        {[...brands, ...brands].map((brand, i) => {
          const coverUrl = getBrandCoverUrl(brand.name);
          return (
            <Link key={`${brand.name}-${i}`} href={`/brand/${encodeURIComponent(brand.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl border border-zinc-800/30 hover:border-amber-500/20 transition-all shrink-0">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="w-6 h-6 rounded object-cover" />
              ) : (
                <span className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-400 font-bold">{brand.name[0]}</span>
              )}
              <span className="text-sm text-zinc-400 hover:text-amber-400 transition-colors">{brand.name}</span>
              <span className="text-xs text-zinc-600">({brand.product_count})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function HeroSection() {
  const stats = getStats();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CigaretteProduct[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length >= 1) {
      const r = searchProducts(value);
      setResults(r);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  return (
    <section className="relative">
      {/* Effects Layer */}
      <SmokeParticles />

      {/* Breathing orb */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[900px] h-[600px] rounded-full bg-amber-500/20 blur-[100px] animate-drift-breath" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center py-12 sm:py-20 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-8">
          <Flame className="w-3.5 h-3.5" /> 全新上线 · 现代化香烟数据库
        </div>

        {/* Animated text */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
          <span className="text-zinc-100"><AnimatedText text="探索香烟的" /></span><br />
          <span><AnimatedText text="全新维度" gradient /></span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          汇集品牌大全、理化指标、价格对比、用户评分<br />现代化的香烟数据查询体验
        </p>

        {/* Search with pulse ring */}
        <div className="relative max-w-xl mx-auto">
          <div className="relative">
            {/* Pulse ring */}
            <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur animate-pulse-ring" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input type="text" placeholder="搜索香烟品牌或产品名称..." value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                className="pl-12 pr-4 py-6 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-2xl text-base focus-visible:ring-amber-500/30 relative z-10" />
            </div>
          </div>

          {showResults && query.length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-[100]">
              {results.length > 0 ? (
                <div className="max-h-80 overflow-y-auto p-2">
                  {results.slice(0, 8).map((product) => (
                    <Link key={product.id} href={`/product/${product.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-xl transition-colors"
                      onClick={() => setShowResults(false)}>
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 font-bold text-sm">{product.brand_name?.[0] || "?"}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.type} · {product.tar} · {product.price_per_box}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-zinc-500">未找到匹配的产品</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-8 mt-10">
          {[{ icon: Cigarette, label: "品牌数", value: stats.totalBrands.toString(), suffix: "" },
            { icon: Package, label: "产品数", value: stats.totalProducts.toLocaleString(), suffix: "" },
            { icon: TrendingUp, label: "平均评分", value: stats.avgRating, suffix: "" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <stat.icon className="w-4 h-4 text-zinc-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-zinc-200">{stat.value}<span className="text-amber-400">{stat.suffix}</span></div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, href }: { icon: React.ElementType; title: string; subtitle: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Icon className="w-5 h-5 text-amber-400" /></div>
        <div><h2 className="text-xl font-bold text-zinc-100">{title}</h2><p className="text-sm text-zinc-500">{subtitle}</p></div>
      </div>
      <Link href={href} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-amber-400 transition-colors">查看全部 <ArrowUpRight className="w-3.5 h-3.5" /></Link>
    </div>
  );
}

export default function HomePage() {
  const popular = getMostPopular(8);
  const topRated = getTopRated(8);
  const brands = getBrands();

  return (
    <div className="min-h-screen">
      <HeroSection />
      <Separator className="bg-zinc-800/50" />

      {/* Popular */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader icon={Flame} title="热门产品" subtitle="最受关注香烟排行" href="/rankings" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {popular.map((product, i) => (<ProductCard key={product.id} product={product} rank={i + 1} />))}
        </div>
      </section>

      <Separator className="bg-zinc-800/50" />

      {/* Top Rated */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader icon={Star} title="高分推荐" subtitle="用户评分最高的香烟" href="/rankings?tab=rated" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {topRated.map((product, i) => (<ProductCard key={product.id} product={product} rank={i + 1} />))}
        </div>
      </section>

      <Separator className="bg-zinc-800/50" />

      {/* Brand Marquee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader icon={Package} title="品牌总览" subtitle="浏览所有香烟品牌" href="/brands" />
        <BrandMarquee brands={brands.slice(0, 20)} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {brands.slice(0, 8).map((brand) => {
            const coverUrl = getBrandCoverUrl(brand.name);
            return (
            <Link key={brand.name} href={`/brand/${encodeURIComponent(brand.name)}`}
              className="group relative bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl border border-zinc-800/50 hover:border-amber-500/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
              {coverUrl ? (
                <div className="aspect-[2/1] bg-zinc-800/30 overflow-hidden">
                  <img src={coverUrl} alt={brand.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-[2/1] bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                  <span className="text-4xl font-bold text-amber-400/30">{brand.name[0]}</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">{brand.name}</h3>
                <p className="text-xs text-zinc-600 mt-1">{brand.product_count} 个产品</p>
              </div>
            </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
