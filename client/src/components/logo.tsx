import { Image } from "@/components/ui/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="logoo.jpg"
        alt="Luminaras"
        width="90"
        height="80"
      />
      <div className="hidden md:block text-xs text-muted-foreground">
        Empower, Play, Connect
      </div>
    </div>
  );
}