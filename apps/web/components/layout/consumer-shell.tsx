import type { ReactNode } from "react";
import { FloatingDock } from "./floating-dock";
import { SiteFooter, SiteHeader } from "./site-shell";

export function ConsumerShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas text-text flex min-h-screen max-w-full flex-col overflow-x-clip">
      <SiteHeader />
      <main
        id="main"
        className="cg-container max-w-full flex-1 overflow-x-clip py-10 pb-28 sm:py-14 sm:pb-32"
      >
        {children}
      </main>
      <SiteFooter />
      <FloatingDock />
    </div>
  );
}

export default ConsumerShell;
