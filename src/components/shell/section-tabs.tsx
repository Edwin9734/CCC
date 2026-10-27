"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from "react";
import { cn } from "@/lib/utils";
import type { TabDef } from "@/lib/section-tabs";

interface TabsContextValue {
  active: string;
  target: string | null;
  setActive: (key: string, target?: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

// Permite que una parte de la página (por ejemplo, el menú de ejemplo) cambie de pestaña
// y le indique qué elemento abrir (por ejemplo, una receta).
export function useSectionTabs() {
  return useContext(TabsContext);
}

function TabIcon({ name }: { name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/tab-icons/${name}.svg`} alt="" aria-hidden="true" width={28} height={28} className="h-7 w-7" />
  );
}

// Muestra una parte de la página a la vez, con una barra de navegación inferior.
// Las partes que no se ven quedan ocultas (no se pierde lo que escribiste en ellas).
export function SectionTabs({
  tabs,
  initialTab,
  panels
}: {
  tabs: TabDef[];
  initialTab: string;
  panels: Record<string, ReactNode>;
}) {
  const [active, setActiveState] = useState(initialTab);
  const [target, setTarget] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Si la dirección cambia desde afuera (por ejemplo, un enlace de otra sección), seguimos esa pestaña.
  useEffect(() => {
    setActiveState(initialTab);
    setTarget(null);
  }, [initialTab]);

  const setActive = useCallback((key: string, nextTarget?: string) => {
    setActiveState(key);
    setTarget(nextTarget ?? null);

    // La pestaña queda en la dirección, sin agregar pasos al historial del navegador.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", key);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Si no se puede, la pestaña igual cambia.
    }

    // Si el contenido quedó por encima de la pantalla, volvemos a su inicio.
    const box = containerRef.current;
    if (box && box.getBoundingClientRect().top < 0) {
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const contextValue = useMemo(() => ({ active, target, setActive }), [active, target, setActive]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + step + tabs.length) % tabs.length;
    setActive(tabs[next].key);
    document.getElementById(`tab-${tabs[next].key}`)?.focus();
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div ref={containerRef} className="scroll-mt-24 pb-28">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            id={`panel-${tab.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.key}`}
            hidden={tab.key !== active}
            className="space-y-6"
          >
            {panels[tab.key] ?? null}
          </div>
        ))}
      </div>

      <nav
        aria-label="Partes de esta sección"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <div role="tablist" className="mx-auto flex max-w-3xl overflow-x-auto px-2 py-1.5">
          {tabs.map((tab, index) => {
            const selected = tab.key === active;
            return (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.key)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "flex min-w-[4.5rem] flex-1 shrink-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center text-xs font-semibold leading-tight transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                  selected ? "bg-accentSoft text-accent" : "text-muted hover:bg-slate-50"
                )}
              >
                <TabIcon name={tab.icon} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </TabsContext.Provider>
  );
}