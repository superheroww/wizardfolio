"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import { UserPosition } from "@/lib/exposureEngine";

type QuickStartTemplatesProps = {
  onTemplateSelect: (positions: UserPosition[], template: Template) => void;
};

type Template = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  positions: UserPosition[];
  type: "template" | "custom";
  isDefaultTemplate: boolean;
};

const QUICK_START_TEMPLATES: Template[] = [
  {
    id: "core-us-intl",
    emoji: "🏛️",
    name: "Core US & Intl",
    description: "Simple mix of US and international stocks.",
    positions: [
      { symbol: "VTI", weightPct: 60 },
      { symbol: "VXUS", weightPct: 40 },
    ],
    type: "template",
    isDefaultTemplate: true,
  },
  {
    id: "global-three-fund",
    emoji: "🌍",
    name: "Global Three-Fund",
    description: "Broad US and international equity exposure.",
    positions: [
      { symbol: "VTI", weightPct: 40 },
      { symbol: "VXUS", weightPct: 30 },
      { symbol: "VT", weightPct: 30 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "couch-potato",
    emoji: "🇨🇦",
    name: "Couch Potato",
    description: "Lazy Canadian portfolio style (all-equity version).",
    positions: [
      { symbol: "XEQT.TO", weightPct: 80 },
      { symbol: "VCN.TO", weightPct: 20 }, // replaced ZAG.TO (bond ETF)
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "growth-focus",
    emoji: "🚀",
    name: "Growth Focus",
    description: "More tilted to growth stocks.",
    positions: [
      { symbol: "QQQ", weightPct: 60 },
      { symbol: "VUG", weightPct: 40 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "dividends-tilt",
    emoji: "💸",
    name: "Dividends Tilt",
    description: "Leans into dividend ETFs.",
    positions: [
      { symbol: "SCHD", weightPct: 40 },
      { symbol: "VDY.TO", weightPct: 30 },
      { symbol: "ZDV.TO", weightPct: 30 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "build-your-own",
    emoji: "✏️",
    name: "Build Your Own Mix",
    description: "Start fresh and customize everything.",
    positions: [],
    type: "custom",
    isDefaultTemplate: false,
  },
];

export default function QuickStartTemplates({
  onTemplateSelect,
}: QuickStartTemplatesProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { capture } = usePostHogSafe();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const indexAttr = entry.target.getAttribute("data-index");
          const sectionIndex = Number(indexAttr);
          if (!Number.isNaN(sectionIndex)) {
            setActiveIndex(sectionIndex);
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleTryTemplate = (template: Template, index: number) => {
    setActiveIndex(index);
    capture("starting_point_selected", {
      starting_point_id: template.id,
      starting_point_label: template.name,
      starting_point_type: template.type,
      source_page: "home",
      positions_count: template.positions.length,
      is_default_template: template.isDefaultTemplate,
    });
    const clonedPositions = template.positions.map((position) => ({
      ...position,
    }));
    onTemplateSelect(clonedPositions, template);
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="
          flex gap-3 overflow-x-auto pb-1 pt-2 scroll-smooth snap-x snap-mandatory
          md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:snap-none
        "
        style={{ scrollbarWidth: "none" }}
      >
        {QUICK_START_TEMPLATES.map((template, index) => (
          <div
            key={template.name}
            data-index={index}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className="
              min-w-[80%] max-w-[85%] snap-center sm:min-w-[320px] sm:max-w-[360px]
              md:min-w-0 md:max-w-none md:snap-none
            "
          >
            <div className="flex h-full flex-col justify-between rounded-2xl border border-[--color-border-subtle] bg-[--color-muted] p-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template.emoji}</span>
                  <p className="text-base font-semibold text-[--color-foreground]">
                    {template.name}
                  </p>
                </div>
                <p className="text-xs text-[--color-text-muted]">
                  {template.description}
                </p>
                <p className="text-xs font-medium tracking-tight text-[--color-foreground] sm:text-sm">
                  {template.positions.length
                    ? template.positions
                        .map(
                          (position) =>
                            `${position.weightPct}% ${position.symbol}`
                        )
                        .join(" · ")
                    : "Empty slate ready for your ideas."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTryTemplate(template, index)}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-[--color-border-subtle] bg-[--color-background] px-3 py-1 text-xs font-medium text-[--color-foreground] hover:bg-[--color-muted]"
              >
                Load this mix
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        aria-label="Quick start templates progress"
        className="flex items-center gap-2 md:hidden"
      >
        {QUICK_START_TEMPLATES.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              index === activeIndex
                ? "w-3.5 bg-[--color-accent]"
                : "w-2 bg-[--color-muted-strong]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
