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
                className="mt-4 inline-flex items-center justify-center rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Try this →
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
                ? "w-3.5 bg-neutral-900"
                : "w-2 bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}