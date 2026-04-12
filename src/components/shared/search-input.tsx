import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input aria-label={placeholder} className="pl-9" placeholder={placeholder} />
    </div>
  );
}

