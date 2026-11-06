import { ContentRowSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="cg-container flex-1 py-12">
      <ContentRowSkeleton count={5} />
    </div>
  );
}
