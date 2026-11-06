import { ContentRowSkeleton } from "@/components/ui";
import { BrandMark } from "@/components/layout/brand";

export default function Loading() {
  return (
    <main id="main" className="route-loading" aria-busy="true" aria-label="Loading the archive">
      <div>
        <BrandMark />
        <p className="eyebrow">Setting the scene…</p>
      </div>
      <div className="loading-title-line" />
      <ContentRowSkeleton count={5} />
    </main>
  );
}
