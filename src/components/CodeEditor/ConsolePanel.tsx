import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash } from "lucide-react";

/**
 * Console panel component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.consoleLogs - Console logs
 * @param {Function} props.clearConsole - Clear console logs
 * @param {Function} props.getConsoleLogClass - Get CSS class for console log type
 */
export default function ConsolePanel({ consoleLogs, clearConsole, getConsoleLogClass }) {
    return (
        <div className="h-2/5 border-t dark:border-gray-800">
            <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800">
                <div className="text-sm font-medium flex items-center">
                    <Terminal size={14} className="mr-2" /> Console
                </div>
                <div className="flex space-x-2">
                    <Tooltip content="Clear Console">
                        <Button
                            onClick={clearConsole}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                        >
                            <Trash size={14} />
                        </Button>
                    </Tooltip>
                </div>
            </div>
            <ScrollArea className="h-full bg-black text-white p-2 font-mono text-sm">
                {consoleLogs.length === 0 ? (
                    <div className="text-gray-500 italic p-2">
                        No console output yet. Run your code to see logs here.
                    </div>
                ) : (
                    consoleLogs.map((log: any) => (
                        <div key={log.id} className={`py-1 ${getConsoleLogClass(log.type)}`}>
                            {log.content}
                        </div>
                    ))
                )}
            </ScrollArea>
        </div>
    );
}