import { AppNav } from "@/components/app-nav";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100lvh] flex flex-col">
      <AppNav />
      <main className="flex-1 md:pb-0" style={{ paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}>
        <AppShell>{children}</AppShell>
      </main>
    </div>
  );
}
