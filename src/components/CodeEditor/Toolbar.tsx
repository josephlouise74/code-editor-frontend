import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    Maximize2,
    Minimize2,
    Share2,
    Save,  // Add this
    Play,
    Code,
    Eye,
    LayoutGrid,
    X,
    Loader2,
    History,
    MessageSquare, // Add MessageSquare icon
} from "lucide-react";
import { ShareDialog } from "./ShareDialog";
import { cn } from "@/lib/utils";



/**
 * ToolBar component for the code editor
 * 
 * @param {Object} props - Component props
 * @param {string} props.roomId - Current room ID
 * @param {boolean} props.isConnected - Connection status
 * @param {boolean} props.isFullScreen - Full screen status
 * @param {boolean} props.copied - Whether link has been copied
 * @param {string} props.layout - Current layout (editor, split, preview)
 * @param {Function} props.setIsFullScreen - Toggle full screen
 * @param {Function} props.setLayout - Change layout
 * @param {Function} props.saveAndRunCode - Save and run code
 * @param {Function} props.handleShareRoom - Share room
 * @param {Function} props.setCopied - Set copied status
 */
// Update the interface to include isSaving prop
interface ToolBarProps {
    roomId: string,
    isConnected: boolean,
    isFullScreen: boolean,
    copied: boolean,
    layout: string,
    setIsFullScreen: () => void,
    setLayout: () => void,
    saveAndRunCode: () => void,
    handleShareRoom: () => void,
    setCopied: () => void,
    handleSaveChanges: () => void;
    isSaving: boolean;
    // ... existing props
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    // Add new props for chat sidebar
    showChatSidebar: boolean;
    setShowChatSidebar: (show: boolean) => void;
}

export default function ToolBar({
    roomId,
    isConnected,
    isFullScreen,
    copied,
    layout,
    setIsFullScreen,
    setLayout,
    saveAndRunCode,
    showHistory,
    setShowHistory,
    setCopied,
    handleSaveChanges,
    isSaving,
    token,
    // Add new props with default values
    showChatSidebar = false,
    setShowChatSidebar = () => { }
}: any) {

    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

    const handleShareRoom = () => {
        setIsShareDialogOpen(true);
    };

    return (
        <>
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center">
                    <Code className="mr-2 h-6 w-6" />
                    <h1 className="text-xl font-bold">Code Editor</h1>
                    {isConnected && (
                        <Badge variant="outline" className="ml-2">
                            Room: {roomId.slice(0, 6)}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <div className="hidden md:flex space-x-2 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setLayout("editor")}
                                    variant={layout === "editor" ? "default" : "outline"}
                                    size="sm"
                                    className="h-8"
                                >
                                    <Code size={16} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Editor Only</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setLayout("split")}
                                    variant={layout === "split" ? "default" : "outline"}
                                    size="sm"
                                    className="h-8"
                                >
                                    <LayoutGrid size={16} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Split View</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setLayout("preview")}
                                    variant={layout === "preview" ? "default" : "outline"}
                                    size="sm"
                                    className="h-8"
                                >
                                    <Eye size={16} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Preview Only</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    {/*   <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={saveAndRunCode} variant="default" size="sm" className="h-8">
                                <Play size={16} className="mr-1" />
                                <span className="hidden md:inline">Run</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Save & Run</p>
                        </TooltipContent>
                    </Tooltip> */}

                    {/* Add Chat Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => setShowChatSidebar(!showChatSidebar)}
                                variant={showChatSidebar ? "default" : "outline"}
                                size="sm"
                                className="h-8"
                            >
                                <MessageSquare size={16} className="mr-1" />
                                <span className="hidden md:inline">Chat</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{showChatSidebar ? "Hide Chat" : "Show Chat"}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handleShareRoom} variant="outline" size="sm" className="h-8">
                                <Share2 size={16} className="mr-1" />
                                <span className="hidden md:inline">Share</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Share Room</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handleSaveChanges} variant="outline" size="sm" className="h-8">
                                <Save size={16} className="mr-1" />
                                <span className="hidden md:inline">Save</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Save Changes</p>
                        </TooltipContent>
                    </Tooltip>
                    {/*   <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                variant="outline"
                                size="sm"
                                className="h-8"
                            >
                                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</p>
                        </TooltipContent>
                    </Tooltip> */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                                className={cn("h-8", showHistory && "bg-accent")}
                            >
                                <History className="h-4 w-4 mr-1" />
                                <span className="hidden md:inline">History</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{showHistory ? "Hide History" : "Show History"}</p>
                        </TooltipContent>
                    </Tooltip>

                    <ShareDialog
                        isOpen={isShareDialogOpen}
                        onClose={() => setIsShareDialogOpen(false)}
                        roomId={roomId}
                        token={token}
                    />
                </div>
            </div>

            {/* Notification Banners */}
            <div className="space-y-2 mx-4 my-4">
                {copied && (
                    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-3 rounded-md flex justify-between items-center">
                        <p className="text-sm text-green-600 dark:text-green-400">
                            Room link copied! Share it with others to collaborate in real-time.
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setCopied(false)}>
                            <X size={16} />
                        </Button>
                    </div>
                )}

                {isConnected && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-md mb-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                Connected to room: {roomId}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add this before the closing fragment */}
            <Dialog open={isSaving} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-t-primary animate-spin" />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <Save className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold tracking-tight">
                                Saving Changes
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Please wait while we save your code changes...
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Syncing with server</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}