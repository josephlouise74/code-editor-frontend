

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="flex min-h-screen bg-muted/40">


            {/* Main content area */}
            <div className="flex flex-1 flex-col w-full">
                <div className="flex-1 flex flex-col">
                    <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-transparent">
                        {children}
                    </main>
                </div>
            </div>

        </div>
    );
}
