"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProductById, getProductsByBrand } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export const runtime = 'edge';
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Flame,
  Cigarette,
  Package,
  Ruler,
  Palette,
  Barcode,
  DollarSign,
  Wind,
  Beaker,
  ArrowLeft,
  TrendingUp,
  MessageCircle,
} from "lucide-react";

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i <= Math.round(rating / 2)
              ? "text-amber-400 fill-amber-400"
              : "text-zinc-600"
          }`}
        />
      ))}
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-zinc-500">{label}</span>
        </div>
        <p className="text-lg font-semibold text-zinc-100">{value || "—"}</p>
      </CardContent>
    </Card>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const product = getProductById(Number(params.id));

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Cigarette className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-zinc-300 mb-2">产品未找到</h1>
        <p className="text-zinc-500 mb-6">该产品可能已被移除或ID不存在</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  const relatedProducts = getProductsByBrand(product.brand_name)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-amber-950/20 rounded-3xl border border-zinc-800/50 p-8 sm:p-10 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Product Image */}
          {product.coverpic_thumb400x300 && (
            <div className="lg:w-80 shrink-0">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800/50 border border-zinc-700/30">
                <img
                  src={product.coverpic_thumb400x300}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 flex-1">
          <div className="flex-1">
            {/* Brand */}
            <Link
              href={`/brand/${encodeURIComponent(product.brand_name)}`}
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors mb-3"
            >
              <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center text-xs font-bold">
                {product.brand_name[0]}
              </div>
              {product.brand_name}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge className="bg-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm">
                {product.type}
              </Badge>
              {product.cigarette_type.split(" ").map((t) =>
                t ? (
                  <Badge
                    key={t}
                    className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/10 text-sm"
                  >
                    {t}
                  </Badge>
                ) : null
              )}
              <Badge className="bg-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm">
                {product.tar}
              </Badge>
            </div>
            {/* Price */}
            <div className="flex items-baseline gap-6 mb-6">
              <div>
                <p className="text-sm text-zinc-500 mb-1">小盒价格</p>
                <p className="text-3xl font-bold text-amber-400">{product.price_per_box}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">条装价格</p>
                <p className="text-2xl font-bold text-zinc-400">{product.price_per_carton}</p>
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div className="sm:w-64 shrink-0">
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardContent className="p-6">
                <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wide">综合评分</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-amber-400">
                    {product.rating_overall.toFixed(1)}
                  </span>
                  <span className="text-sm text-zinc-500">/ 10</span>
                </div>
                <StarRating rating={product.rating_overall} />
                <p className="text-xs text-zinc-600 mt-3">
                  {product.rating_count} 人参与评分
                </p>

                <Separator className="bg-zinc-800 my-4" />

                {/* Rating breakdown */}
                <div className="space-y-2">
                  {[
                    { label: "口味", value: product.rating_taste },
                    { label: "外观", value: product.rating_appearance },
                    { label: "性价比", value: product.rating_value },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{r.label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(r.value / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-400 w-7 text-right">
                          {r.value.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-300 font-medium">
              {product.popularity.toLocaleString()}
            </span>
            热度
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <MessageCircle className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-300 font-medium">{product.comment_count}</span>
            评论
          </div>
        </div>
      </div>

      {/* Product Info */}
      <Tabs defaultValue="specs" className="mb-12">
        <TabsList className="bg-zinc-900/50 border border-zinc-800/50 p-1 rounded-xl">
          <TabsTrigger
            value="specs"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 rounded-lg"
          >
            理化指标
          </TabsTrigger>
          <TabsTrigger
            value="packaging_info"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 rounded-lg"
          >
            包装信息
          </TabsTrigger>
          <TabsTrigger
            value="barcodes"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 rounded-lg"
          >
            条码信息
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <InfoItem label="焦油量" value={product.tar} icon={Wind} />
            <InfoItem label="烟碱量" value={product.nicotine} icon={Beaker} />
            <InfoItem label="一氧化碳" value={product.co} icon={Wind} />
            <InfoItem label="烟长" value={product.length} icon={Ruler} />
            <InfoItem label="类型" value={product.type} icon={Cigarette} />
            <InfoItem label="烟支类型" value={product.cigarette_type || "普通"} icon={Cigarette} />
            <InfoItem
              label="每盒数量"
              value={`${product.quantity_per_box} 支`}
              icon={Package}
            />
            <InfoItem
              label="条装盒数"
              value={`${product.boxes_per_carton} 盒`}
              icon={Package}
            />
          </div>
        </TabsContent>

        <TabsContent value="packaging_info" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoItem label="包装形式" value={product.packaging} icon={Package} />
            <InfoItem label="主色调" value={product.primary_color} icon={Palette} />
            <InfoItem label="副色调" value={product.secondary_color} icon={Palette} />
          </div>
        </TabsContent>

        <TabsContent value="barcodes" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoItem label="小盒条码" value={product.barcode_box} icon={Barcode} />
            <InfoItem label="条装条码" value={product.barcode_carton} icon={Barcode} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <>
          <Separator className="bg-zinc-800/50 mb-8" />
          <section>
            <h2 className="text-xl font-bold text-zinc-100 mb-6">
              同品牌其他产品 · {product.brand_name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.map((rp) => (
                <Link key={rp.id} href={`/product/${rp.id}`}>
                  <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-amber-500/20 hover:bg-zinc-900 transition-all duration-300 group cursor-pointer">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-amber-400 transition-colors">
                        {rp.name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-zinc-500">
                          {rp.type} · {rp.tar}
                        </span>
                        <span className="text-sm font-bold text-amber-400">
                          {rp.price_per_box}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
