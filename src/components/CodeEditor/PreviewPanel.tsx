import React, { useState, useEffect, RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { Eye, Terminal, RefreshCw, Maximize, Minimize } from "lucide-react";

interface PreviewPanelProps {
    iframeRef: RefObject<HTMLIFrameElement>;
    srcDoc: string;
    showConsole: boolean;
    setShowConsole: (show: boolean) => void;
    saveAndRunCode: () => void;
}

/**
 * Preview panel component
 * 
 * @param props Component props
 */
export default function PreviewPanel({
    iframeRef,
    srcDoc,
    showConsole,
    setShowConsole,
    saveAndRunCode,
}: any) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            // Enter fullscreen
            const previewContainer = document.getElementById('preview-container');
            if (previewContainer) {
                if (previewContainer.requestFullscreen) {
                    previewContainer.requestFullscreen();
                } else if ((previewContainer as any).webkitRequestFullscreen) {
                    (previewContainer as any).webkitRequestFullscreen();
                } else if ((previewContainer as any).msRequestFullscreen) {
                    (previewContainer as any).msRequestFullscreen();
                }
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // Listen for fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    return (
        <div id="preview-container" className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b">
                <h2 className="text-sm font-medium">Preview</h2>
                <div className="flex items-center space-x-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={saveAndRunCode}
                                    className="h-7 w-7 p-0"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refresh</p>
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
                                    className="h-7 w-7 p-0"
                                >
                                    <Terminal className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle console</p>
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
                                    className="h-7 w-7 p-0"
                                >
                                    {isFullscreen ?
                                        <Minimize className="h-4 w-4" /> :
                                        <Maximize className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <div className="flex-grow">
                <iframe
                    ref={iframeRef}
                    srcDoc={srcDoc}
                    title="preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-modals"
                />
            </div>
        </div>
    );
}