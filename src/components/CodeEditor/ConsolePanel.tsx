import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Terminal, Trash } from "lucide-react";

interface ConsoleLog {
    id: string;
    type: 'log' | 'error' | 'warn' | 'info';
    content: string;
    timestamp: string;
}

interface ConsolePanelProps {
    consoleLogs: ConsoleLog[];
    clearConsole: () => void;
    getConsoleLogClass: (type: string) => string;
}

export default function ConsolePanel({ consoleLogs, clearConsole, getConsoleLogClass }: ConsolePanelProps) {
    // Auto scroll to bottom when new logs appear
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [consoleLogs]);

    return (
        <ScrollArea className="h-[600px] w-full">
            <div className="border-t dark:border-gray-800">
                <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 sticky top-0 z-[5]">
                    <div className="text-sm font-medium flex items-center">
                        <Terminal size={14} className="mr-2" /> Console
                    </div>
                    <div className="flex space-x-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={clearConsole}
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                    >
                                        <Trash size={14} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Clear Console</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <div 
                    ref={scrollRef}
                    className="bg-black text-white p-2 font-mono text-sm min-h-[500px] max-h-[500px] overflow-y-auto"
                >
                    {consoleLogs.length === 0 ? (
                        <div className="text-gray-500 italic p-2">
                            No console output yet. Run your code to see logs here.
                        </div>
                    ) : (
                        consoleLogs.map((log: ConsoleLog) => (
                            <div 
                                key={log.id} 
                                className={`py-1 ${getConsoleLogClass(log.type)} break-words`}
                            >
                                <span className="text-gray-500 text-xs mr-2">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                {log.content}
                            </div>
                        ))
                    )}
                </div>
            </div>
            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}