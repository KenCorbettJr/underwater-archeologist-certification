"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

interface AdminNavigationProps {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export function AdminNavigation({ user }: AdminNavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-3">
              <span className="text-2xl">🔧</span>
              <span className="text-xl font-bold text-gray-900">
                Admin Panel
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-6">
            {/* User info */}
            <div className="text-sm text-gray-600 font-medium">
              Welcome, {user?.name}
            </div>

            {/* Return to main site */}
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              ← Back to Site
            </Link>

            {/* User button */}
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
