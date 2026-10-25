"use client";

import { useEffect, useRef, useState } from "react";
import { Search, LocateFixed, Loader2, MapPin, Clock, X } from "lucide-react";
import type { GeoLocation } from "@/lib/weather";

interface SearchBarProps {
  onSelect: (loc: GeoLocation) => void;
  recents: GeoLocation[];
  onUseMyLocation: () => void;
  locating: boolean;
}

export function SearchBar({ onSelect, recents, onUseMyLocation, locating }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        /* aborted or failed — keep previous */
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  function pick(loc: GeoLocation) {
    onSelect(loc);
    setQuery("");
    setOpen(false);
  }

  const showRecents = query.trim().length < 2 && recents.length > 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-4 py-2.5 backdrop-blur-xl shadow-lg transition-colors focus-within:border-white/60">
        <Search className="h-4 w-4 shrink-0 text-white/80" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && results.length > 0) pick(results[0]);
          }}
          placeholder="Search city…"
          aria-label="Search for a city"
          className="w-full bg-transparent text-sm text-white placeholder:text-white/60 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-0.5 text-white/70 hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <span className="h-5 w-px shrink-0 bg-white/25" aria-hidden="true" />
        <button
          onClick={onUseMyLocation}
          aria-label="Use my location"
          title="Use my location"
          className="shrink-0 rounded-full p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </button>
      </div>

      {open && (searching || results.length > 0 || showRecents) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/30 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
          {searching && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-white/70">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}

          {!searching && results.length > 0 && (
            <ul role="listbox" aria-label="City search results">
              {results.map((r) => (
                <li key={`${r.id}-${r.latitude}`}>
                  <button
                    onClick={() => pick(r)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                    <span className="truncate">
                      <span className="font-medium">{r.name}</span>
                      {(r.admin1 || r.country) && (
                        <span className="text-white/60">
                          , {r.admin1 ? `${r.admin1}, ` : ""}
                          {r.country}
                        </span>
                      )}
                    </span>
                    {r.countryCode && (
                      <span className="ml-auto shrink-0 rounded-md border border-white/25 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/80">
                        {r.countryCode}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && results.length === 0 && showRecents && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-white/50 uppercase">
                Recent searches
              </p>
              <ul aria-label="Recent searches">
                {recents.map((r) => (
                  <li key={`${r.id}-${r.latitude}-${r.name}`}>
                    <button
                      onClick={() => pick(r)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
                      <span className="truncate">
                        <span className="font-medium">{r.name}</span>
                        {(r.admin1 || r.country) && (
                          <span className="text-white/60">
                            , {r.admin1 ? `${r.admin1}, ` : ""}
                            {r.country}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
