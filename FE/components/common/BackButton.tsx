"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/home"); // fallback
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white">
      <button
        onClick={handleBack}
        className="cursor-pointer px-4 py-3 text-sm font-medium text-black"
      >
        뒤로
      </button>
    </div>
  );
}
