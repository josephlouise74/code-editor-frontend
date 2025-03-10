import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

interface ConsoleLog {
    id: string;
    type: string;
    content: string;
    timestamp: string;
}

interface ConsoleMessage {
    data: {
        type: string;
        logType: string;
        content: string;
    };
}

export function useConsole() {
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
    const [showConsole, setShowConsole] = useState<boolean>(true);

    const getConsoleLogClass = (type: string): string => {
        switch (type) {
            case "error":
                return "text-red-400";
            case "warn":
                return "text-yellow-400";
            case "info":
                return "text-blue-400";
            default:
                return "text-green-400";
        }
    };

    const clearConsole = (): void => {
        setConsoleLogs([]);
    };

    useEffect(() => {
        const handleConsoleMessage = (event: ConsoleMessage): void => {
            if (event.data && event.data.type === "console") {
                setConsoleLogs((prev) => [
                    ...prev,
                    {
                        id: nanoid(),
                        type: event.data.logType,
                        content: event.data.content,
                        timestamp: new Date().toISOString(),
                    },
                ]);
            }
        };

        window.addEventListener("message", handleConsoleMessage as any);
        return () => window.removeEventListener("message", handleConsoleMessage as any);
    }, []);

    return {
        consoleLogs,
        showConsole,
        setShowConsole,
        clearConsole,
        getConsoleLogClass,
    };
}