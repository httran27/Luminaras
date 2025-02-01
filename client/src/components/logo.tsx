import Image from "@/components/ui/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image 
        src="/attached_assets/luminaras logo (transparant).jpg"
        alt="Luminaras"
        className="h-10 w-auto"
      />
      <div className="hidden md:block text-xs text-muted-foreground">
        Empower, Play, Connect
      </div>
    </div>
  );
}