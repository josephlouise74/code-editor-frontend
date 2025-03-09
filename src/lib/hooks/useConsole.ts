/**
 * @typedef {Object} ConsoleLog
 * @property {string} id - Log ID
 * @property {string} type - Log type (log, error, warn, info)
 * @property {string} content - Log content
 * @property {string} timestamp - Log timestamp
 */

/**
 * Hook to manage console functionality
 * @returns {Object} Console state and methods
 */
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";

export function useConsole() {
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [showConsole, setShowConsole] = useState(true);

    // Helper: Get CSS class for console log based on type
    const getConsoleLogClass = (type) => {
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

    // Clear console logs
    const clearConsole = () => {
        setConsoleLogs([]);
    };

    // Intercept console logs from the iframe
    useEffect(() => {
        const handleConsoleMessage = (event) => {
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

        window.addEventListener("message", handleConsoleMessage);
        return () => window.removeEventListener("message", handleConsoleMessage);
    }, []);

    return {
        consoleLogs,
        showConsole,
        setShowConsole,
        clearConsole,
        getConsoleLogClass,
    };
}