import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="flex h-svh overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar user={session?.user} />
            <div className="flex bg-slate-50 dark:bg-slate-900 flex-col flex-1 overflow-x-hidden overflow-y-auto">
                <main className="flex-1 w-full relative sm:p-6 p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
