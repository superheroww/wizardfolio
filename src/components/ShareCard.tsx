"use client";

import { useClipboard } from "@/lib/useClipboard";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function ShareCard() {
  const pathname = usePathname();
  const shareUrl = `https://wizardfolio.com${pathname}`;
  const { copy, copied } = useClipboard();

  return (
    <div className="rounded-2xl border bg-card/60 p-5 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold">🔥 Share your mix</h3>
      <p className="text-sm text-muted-foreground">
        Show your ETF blend on Instagram, Facebook, TikTok, or Reddit.
      </p>

      <div className="flex items-center gap-3 mt-2">
        <Image src="/icons/instagram.png" width={24} height={24} alt="Instagram" />
        <Image src="/icons/facebook.png" width={24} height={24} alt="Facebook" />
        <Image src="/icons/tiktok.png" width={24} height={24} alt="TikTok" />
        <Image src="/icons/reddit.png" width={24} height={24} alt="Reddit" />
      </div>

      <button
        onClick={() => copy(shareUrl)}
        className="w-full rounded-full bg-primary text-white px-4 py-2 text-sm font-medium"
      >
        {copied ? "Copied! 🚀" : "Copy Share Link"}
      </button>
    </div>
  );
}