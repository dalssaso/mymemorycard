import { useNavigate } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSearchData } from "@/hooks/useSearchData";

interface GlobalSearchContextValue {
  isOpen: boolean;
  openSearch: (trigger?: Element | null) => void;
  closeSearch: () => void;
  triggerRef: MutableRefObject<Element | null>;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<Element | null>(null);

  const openSearch = useCallback((trigger?: Element | null) => {
    triggerRef.current = trigger ?? document.activeElement;
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ isOpen, openSearch, closeSearch, triggerRef }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch(): GlobalSearchContextValue {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
  }
  return context;
}

export function GlobalSearch(): JSX.Element {
  const { isOpen, openSearch, closeSearch, triggerRef } = useGlobalSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { sections, totalCount } = useSearchData(searchQuery);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch(document.activeElement);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const emptyLabel = useMemo(() => {
    if (!searchQuery.trim()) return "Type to search games, collections, and more.";
    return totalCount === 0 ? "No results found." : "";
  }, [searchQuery, totalCount]);

  const handleSelect = useCallback(
    (href: string) => {
      closeSearch();
      setSearchQuery("");
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
      navigate({ to: href });
    },
    [closeSearch, navigate, triggerRef]
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeSearch();
          setSearchQuery("");
        }
      }}
    >
      <DialogContent className="border-elevated bg-base text-text-primary h-[100dvh] w-[100vw] max-w-none overflow-hidden border p-0 shadow-xl sm:h-auto sm:w-full sm:max-w-2xl sm:rounded-lg">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search games, collections, platforms, and more.
        </DialogDescription>
        <Command className="bg-base text-text-primary">
          <CommandInput
            ref={inputRef}
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search games, collections, platforms..."
          />
          <CommandList className="max-h-[calc(100dvh-8rem)] sm:max-h-[70vh]">
            {emptyLabel ? <CommandEmpty>{emptyLabel}</CommandEmpty> : null}
            {sections.map((section) => (
              <CommandGroup key={section.label} heading={section.label}>
                {section.items.map((item) => (
                  <CommandItem
                    key={`${section.label}-${item.id}`}
                    value={item.name}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-text-primary truncate text-sm font-medium">{item.name}</p>
                      {item.subtitle ? (
                        <p className="text-text-muted truncate text-xs">{item.subtitle}</p>
                      ) : null}
                    </div>
                    <span className="text-text-muted text-xs uppercase">{item.type}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
