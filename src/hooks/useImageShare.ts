"use client";

import { useState } from "react";
import * as htmlToImage from "html-to-image";

type ShareOptions = {
  fileName?: string;
  title?: string;
  text?: string;
};

export function useImageShare() {
  const [isSharing, setIsSharing] = useState(false);

  async function shareElementAsImage(
    element: HTMLElement | null,
    options?: ShareOptions
  ) {
    if (!element || isSharing) return;

    try {
      setIsSharing(true);

      const dataUrl = await htmlToImage.toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#020617",
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const fileName = options?.fileName ?? "wizardfolio-chart.png";
      const file = new File([blob], fileName, { type: "image/png" });

      const canUseShareWithFiles =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        (navigator as any).canShare({ files: [file] });

      if (canUseShareWithFiles) {
        await (navigator as any).share({
          files: [file],
          title: options?.title ?? "My portfolio snapshot",
          text:
            options?.text ??
            "ETF look-through powered by WizardFolio (wizardfolio.com)",
        });
        return;
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to share image", err);
    } finally {
      setIsSharing(false);
    }
  }

  return { shareElementAsImage, isSharing };
}
