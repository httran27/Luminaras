import { MoonIcon } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-bold text-2xl text-primary">
      <MoonIcon className="h-8 w-8" />
      <span className="font-pixel">Luminaras</span>
    </div>
  );
}
