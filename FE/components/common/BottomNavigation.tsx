'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartPulse, Wallet, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/health', label: '건강', icon: HeartPulse },
  { href: '/finance', label: '재정', icon: Wallet },
  { href: '/map', label: '지도', icon: Map },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="grid h-full grid-cols-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.label}
              className="relative flex flex-col items-center justify-center text-sm font-medium"
            >
              <Icon
                className={cn(
                  'h-6 w-6 mb-1 transition-colors',
                  isActive ? 'text-green-600' : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'transition-colors',
                  isActive ? 'text-green-600' : 'text-gray-500'
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
