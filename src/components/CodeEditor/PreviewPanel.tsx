import React, { useState, useEffect, RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { Eye, Terminal, RefreshCw, Maximize, Minimize, Trash } from "lucide-react";

interface PreviewPanelProps {
    iframeRef: RefObject<HTMLIFrameElement>;
    srcDoc: string;
    showConsole: boolean;
    setShowConsole: (show: boolean) => void;
    saveAndRunCode: () => void;
}

export default function PreviewPanel({
    iframeRef,
    srcDoc,
    showConsole,
    setShowConsole,
    saveAndRunCode,
}: PreviewPanelProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [previousCode, setPreviousCode] = useState(srcDoc);

    useEffect(() => {
        if (srcDoc !== previousCode) {
            const iframe = iframeRef.current;
            if (iframe) {
                iframe.srcdoc = srcDoc;
                setPreviousCode(srcDoc);
            }
        }
    }, [srcDoc, previousCode]);

    const toggleFullscreen = () => {
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) return;

        if (!isFullscreen) {
            if (previewContainer.requestFullscreen) {
                previewContainer.requestFullscreen();
            } else if ((previewContainer as any).webkitRequestFullscreen) {
                (previewContainer as any).webkitRequestFullscreen();
            } else if ((previewContainer as any).msRequestFullscreen) {
                (previewContainer as any).msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        const events = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

        events.forEach(event => {
            document.addEventListener(event, handleFullscreenChange);
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleFullscreenChange);
            });
        };
    }, []);

    return (
        <div id="preview-container" className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between p-2 border-b">
                <h2 className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                </h2>
                <div className="flex items-center space-x-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={saveAndRunCode}
                                    className="h-7 w-7 p-0 hover:bg-accent"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Run Code</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowConsole(!showConsole)}
                                    className="h-7 w-7 p-0 hover:bg-accent"
                                >
                                    <Terminal className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Toggle Console</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleFullscreen}
                                    className="h-7 w-7 p-0 hover:bg-accent"
                                >
                                    {isFullscreen ?
                                        <Minimize className="h-4 w-4" /> :
                                        <Maximize className="h-4 w-4" />
                                    }
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <div className="flex-grow relative">
                <iframe
                    ref={iframeRef}
                    srcDoc={srcDoc}
                    title="preview"
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-scripts allow-modals allow-forms"
                />
            </div>
        </div>
    );
}