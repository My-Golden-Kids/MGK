"use client";

import { cn } from "@/lib/utils";
import { HeartPulse, HouseIcon, ShoppingBag, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/home", label: "홈", icon: HouseIcon },
  { href: "/finance", label: "재정", icon: Wallet },
  { href: "/health", label: "건강", icon: HeartPulse },
  { href: "/product", label: "상품", icon: ShoppingBag },
];

export function BottomNavigation() {
  const pathname = usePathname();

  const isActivePath = (href: string) => {
    if (href === "/home") {
      return pathname === "/home" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="sticky bottom-0 z-50 mt-auto h-20 border-t border-gray-100 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="grid h-full grid-cols-4">
        {navItems.map((item) => {
          const isActive = isActivePath(item.href);
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.label}
              className="relative flex h-full cursor-pointer flex-col items-center justify-center pt-2 pb-3 text-sm font-medium transition-all hover:brightness-50"
            >
              <div className="flex h-7 items-center justify-center">
                <Icon
                  className={cn(
                    "h-6 w-6 shrink-0 transition-colors",
                    isActive ? "text-green-600" : "text-gray-400",
                  )}
                />
              </div>
              <span
                className={cn(
                  "mt-1 min-h-[20px] leading-none transition-colors",
                  isActive ? "text-green-600" : "text-gray-500",
                )}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="absolute bottom-2 h-1 w-6 rounded-full bg-green-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
