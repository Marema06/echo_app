import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-12">
      <Topbar />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
