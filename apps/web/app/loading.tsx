import { ContentRowSkeleton } from "@/components/ui";
import { BrandMark } from "@/components/layout/brand";

export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-busy="true" aria-label="Loading the archive">
      <div>
        <BrandMark />
        <p className="eyebrow">Setting the scene…</p>
      </div>
      <div className="loading-title-line" />
      <ContentRowSkeleton count={5} />
    </div>
  );
}
