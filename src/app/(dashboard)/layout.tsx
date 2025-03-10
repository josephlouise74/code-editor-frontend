

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Mobile and Tablet Warning */}
            <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md text-center">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Desktop View Required</h2>
                    <p className="text-gray-600">
                        For the best experience, please use a desktop computer to access the code editor.
                        The editor is not optimized for mobile or tablet devices.
                    </p>
                </div>
            </div>

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
