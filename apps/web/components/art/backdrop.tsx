import { KeyArt } from "./key-art";
import type { ArtSpec } from "@/lib/catalogue/types";

export function ArtBackdrop({ spec, className = "" }: { spec: ArtSpec; className?: string }) {
  return (
    <div className={`art-backdrop ${className}`} aria-hidden="true">
      <KeyArt spec={spec} variant="backdrop" className="backdrop-desktop" />
      <KeyArt spec={spec} className="backdrop-mobile" />
      <div className="art-grain" />
    </div>
  );
}
