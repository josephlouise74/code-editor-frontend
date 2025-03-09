import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Eye, Terminal, RefreshCw, Maximize, Minimize } from "lucide-react";

/**
 * Preview panel component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.iframeRef - Reference to the iframe
 * @param {string} props.srcDoc - Source document for the iframe
 * @param {boolean} props.showConsole - Whether to show console
 * @param {Function} props.setShowConsole - Toggle console visibility
 * @param {Function} props.saveAndRunCode - Save and run code
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
    React.useEffect(() => {
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
        <>
            <div id="preview-container" className="flex flex-col h-full">
                <div className="flex items-center justify-between p-2   0 border-b">
                    <h2 className="text-sm font-medium">Preview</h2>
                    <div className="flex items-center space-x-1">
                        <Tooltip content="Refresh">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveAndRunCode}
                                className="h-7 w-7 p-0"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Toggle console">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowConsole(!showConsole)}
                                className="h-7 w-7 p-0"
                            >
                                <Terminal className="h-4 w-4" />
                            </Button>
                        </Tooltip>
                        <Tooltip content={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
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
                        </Tooltip>
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
        </>
    );
}