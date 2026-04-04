import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Logo({ className, iconOnly = false }: { className?: string, iconOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-10 w-10 overflow-hidden rounded-lg shrink-0">
        <Image 
          src="/logo-infinite.png" 
          alt="Bariweb Logo" 
          fill
          className="object-contain"
          priority
        />
      </div>
      {!iconOnly && (
        <span className="font-bold text-2xl tracking-tighter text-white">
          Bari<span className="text-lime-400">web</span>
        </span>
      )}
    </div>
  );
}

