"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Search, Menu, X } from "lucide-react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/products", label: "产品" },
  { href: "/brands", label: "品牌" },
  { href: "/rankings", label: "排行榜" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9">
                  <img src="/logo.png" alt="CigaBase" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">CigaBase</span>
                  <span className="hidden sm:inline text-xs text-zinc-500 ml-2">香烟大全</span>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      pathname === link.href ? "text-amber-400 bg-amber-500/10" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                    }`}>
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/50 transition-colors">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
              <nav className="md:hidden border-t border-zinc-800 py-2 pb-3 animate-in slide-in-from-top-2">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      pathname === link.href ? "text-amber-400 bg-amber-500/10" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                    }`}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-zinc-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-400">CigaBase</span>
                <span>© 2026</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <Link href="/brands" className="hover:text-zinc-300 transition-colors">品牌</Link>
                <Link href="/rankings" className="hover:text-zinc-300 transition-colors">排行榜</Link>
              </div>
              <span className="text-xs">吸烟有害健康</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
