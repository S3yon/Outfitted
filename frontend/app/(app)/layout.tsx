import { AppNav } from "@/components/app-nav";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <AppNav />
      <main className="flex-1 pb-14 md:pb-0">
        <AppShell>{children}</AppShell>
      </main>
    </div>
  );
}
