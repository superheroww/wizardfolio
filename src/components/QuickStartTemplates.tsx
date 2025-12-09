"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import { UserPosition } from "@/lib/exposureEngine";
import { QUICK_START_TEMPLATES, type Template } from "@/lib/quickStartTemplates";

type QuickStartTemplatesProps = {
  onTemplateSelect: (positions: UserPosition[], template: Template) => void;
};

export default function QuickStartTemplates({
  onTemplateSelect,
}: QuickStartTemplatesProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { capture } = usePostHogSafe();

  // ✅ Normalize QUICK_START_TEMPLATES so we never call .map on undefined / non-array
  const templates: Template[] = Array.isArray(QUICK_START_TEMPLATES)
    ? QUICK_START_TEMPLATES
    : QUICK_START_TEMPLATES
    ? (Object.values(QUICK_START_TEMPLATES) as Template[])
    : [];

  console.log("QUICK_START_TEMPLATES runtime value:", QUICK_START_TEMPLATES);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!templates.length) return;

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
      },
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [templates.length]);

  const handleTryTemplate = (template: Template, index: number) => {
    setActiveIndex(index);

    const positions = template.positions ?? [];

    capture("starting_point_selected", {
      starting_point_id: template.id,
      starting_point_label: template.name,
      starting_point_type: template.type,
      source_page: "home",
      positions_count: positions.length,
      is_default_template: template.isDefaultTemplate,
    });

    const clonedPositions = positions.map((position) => ({ ...position }));
    onTemplateSelect(clonedPositions, template);
  };

  // If for some reason templates is empty, render nothing but avoid crashing the page
  if (!templates.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="
          flex gap-3 overflow-x-auto pb-1 pt-2 scroll-smooth snap-x snap-mandatory
          md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:snap-none
          lg:grid-cols-4 xl:grid-cols-5
        "
        style={{ scrollbarWidth: "none" }}
      >
        {templates.map((template, index) => {
          const positions = template.positions ?? [];
          return (
            <div
              key={template.id ?? template.name}
              data-index={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="
                min-w-[80%] max-w-[85%] snap-center sm:min-w-[320px] sm:max-w-[360px]
                md:min-w-0 md:max-w-none md:snap-none
              "
            >
              <div className="flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm shadow-neutral-200 backdrop-blur">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{template.emoji}</span>
                    <p className="text-base font-semibold text-neutral-900">
                      {template.name}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-700">
                    {template.description}
                  </p>
                  <p className="text-sm text-neutral-700">
                    {positions.length
                      ? positions
                          .map(
                            (position) =>
                              `${position.weightPct}% ${position.symbol}`,
                          )
                          .join(" · ")
                      : "Empty slate ready for your ideas."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTryTemplate(template, index)}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Try this →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        aria-label="Quick start templates progress"
        className="flex items-center gap-2 md:hidden"
      >
        {templates.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              index === activeIndex
                ? "w-3.5 bg-neutral-900"
                : "w-2 bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}