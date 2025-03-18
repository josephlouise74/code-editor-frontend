import { useState, useEffect } from "react";
import { format } from "date-fns";
import { History, RotateCcw, Eye, ChevronLeft, ChevronRight, RefreshCw, Code } from "lucide-react";
import { toast } from "react-toastify";

// UI Components
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Types
interface CodeContent {
    css: string;
    html: string;
    javascript: string;
}

interface UserData {
    accessCode: string;
    codeContent: CodeContent;
    exp: number;
    iat: number;
    role: string;
    roomId: string;
    roomName: string;
    version: number;
}

interface HistoryData {
    accessCode: string;
    codeContent: CodeContent;
    modifiedBy: string;
    participantName?: string;
    participantEmail?: string;
    roomName: string;
    timestamp: Date;
    version: number;
    userData: UserData;
}

interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    totalItems: number;
    itemsPerPage: number;
}

interface HistoryResponse {
    roomId: string;
    history: HistoryData[];
    pagination: PaginationMeta;
    meta: {
        timestamp: string;
        query: {
            page: number;
            limit: number;
            sortBy: string;
        };
    };
}

interface HistoryTrackerProps {
    historyData?: HistoryResponse;
    onRestoreVersion: (version: HistoryData) => void;
    onPreviewVersion: (version: HistoryData) => void;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onInitialLoad?: () => void;
    fetchHistory: () => Promise<void>;
}

const defaultPagination: PaginationMeta = {
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
    totalItems: 0,
    itemsPerPage: 5
};

export function HistoryTracker({
    historyData,
    onRestoreVersion,
    onPreviewVersion,
    onPageChange,
    onLimitChange,
    onInitialLoad,
    fetchHistory
}: HistoryTrackerProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<HistoryData | null>(null);
    const [codeViewOpen, setCodeViewOpen] = useState(false);
    const [activeCodeTab, setActiveCodeTab] = useState("html");

    const history = historyData?.history || [];
    const pagination = historyData?.pagination || defaultPagination;
    const itemsPerPageOptions = [5, 10, 15, 20];

    useEffect(() => {
        if (onInitialLoad) {
            onInitialLoad();
            fetchHistory();
        }
    }, [onInitialLoad, fetchHistory]);

    const refreshData = async () => {
        try {
            setIsRefreshing(true);
            await fetchHistory();
            toast.success("History refreshed successfully");
        } catch (error) {
            console.error("Error refreshing history:", error);
            toast.error("Failed to refresh history");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleViewCode = (version: HistoryData) => {
        setSelectedVersion(version);
        setCodeViewOpen(true);
    };

    const handleRestoreVersion = (version: HistoryData) => {
        onRestoreVersion(version);
        toast.success(`Restored to version ${version.version}`);
    };

    const handlePreviewVersion = (version: HistoryData) => {
        onPreviewVersion(version);
        toast.info(`Previewing version ${version.version}`);
    };

    if (!historyData) {
        return (
            <Card className="w-full max-w-[300px]">
                <CardContent className="py-6 text-center text-muted-foreground">
                    No history data available
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full max-w-[300px] shadow-lg relative z-[100]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 sticky top-0 bg-background z-[101] border-b">
                    <CardTitle className="text-sm font-medium flex items-center">
                        <History className="w-4 h-4 mr-2" />
                        History ({pagination.totalItems || 0})
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7"
                                    onClick={refreshData}
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                                Refresh History
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>

                <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2 p-4">
                            {history.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4 text-sm">
                                    No history records found
                                </div>
                            ) : (
                                history.map((version) => (
                                    <Card key={version.version} className="p-3 relative hover:bg-accent/50 transition-colors">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        v{version.version}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                        {version.participantName || version.modifiedBy || 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-[10px] text-muted-foreground">
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    {format(new Date(version.timestamp), "MMM d, h:mm a")}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                                    {version.participantEmail === undefined ? 'Host' : version.participantEmail}
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={() => handleViewCode(version)}
                                                            >
                                                                <Code className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left" className="text-xs">
                                                            View Code
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={() => handlePreviewVersion(version)}
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left" className="text-xs">
                                                            Preview
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={() => handleRestoreVersion(version)}
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left" className="text-xs">
                                                            Restore
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                        <div className="space-y-1 bg-muted/30 rounded-sm p-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="text-[10px]">HTML</Badge>
                                                </div>
                                                <div className="truncate font-mono text-[10px]">
                                                    {version.codeContent?.html?.slice(0, 20) || 'No HTML'}...
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="flex items-center justify-between py-2 px-4 border-t sticky bottom-0 bg-background z-[101]">
                    <div className="flex items-center gap-2 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => pagination.prevPage && onPageChange(pagination.prevPage)}
                            disabled={!pagination.hasPrevPage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select
                            value={pagination.itemsPerPage?.toString()}
                            onValueChange={(value) => onLimitChange(Number(value))}
                        >
                            <SelectTrigger className="h-8 flex-1 text-xs">
                                <SelectValue placeholder="Per page" />
                            </SelectTrigger>
                            <SelectContent>
                                {itemsPerPageOptions.map((option) => (
                                    <SelectItem key={option} value={option.toString()}>
                                        {option} per page
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => pagination.nextPage && onPageChange(pagination.nextPage)}
                            disabled={!pagination.hasNextPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Code Viewer Dialog */}
            <Dialog open={codeViewOpen} onOpenChange={setCodeViewOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col z-[9999]">
                    <DialogHeader>
                        <DialogTitle>
                            Version {selectedVersion?.version} - {format(new Date(selectedVersion?.timestamp || Date.now()), "MMM d, yyyy h:mm a")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <Tabs value={activeCodeTab} onValueChange={setActiveCodeTab} className="w-full">
                            <TabsList className="grid grid-cols-3 mb-2">
                                <TabsTrigger value="html">HTML</TabsTrigger>
                                <TabsTrigger value="css">CSS</TabsTrigger>
                                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                            </TabsList>

                            <div className="border rounded-md p-4 bg-muted/30 overflow-hidden">
                                <ScrollArea className="h-[400px]">
                                    <TabsContent value="html" className="m-0">
                                        <pre className="whitespace-pre-wrap text-xs font-mono">
                                            {selectedVersion?.codeContent?.html || 'No HTML content'}
                                        </pre>
                                    </TabsContent>

                                    <TabsContent value="css" className="m-0">
                                        <pre className="whitespace-pre-wrap text-xs font-mono">
                                            {selectedVersion?.codeContent?.css || 'No CSS content'}
                                        </pre>
                                    </TabsContent>

                                    <TabsContent value="javascript" className="m-0">
                                        <pre className="whitespace-pre-wrap text-xs font-mono">
                                            {selectedVersion?.codeContent?.javascript || 'No JavaScript content'}
                                        </pre>
                                    </TabsContent>
                                </ScrollArea>
                            </div>
                        </Tabs>
                    </div>

                    <div className="flex justify-between mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setCodeViewOpen(false)}
                        >
                            Close
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handlePreviewVersion(selectedVersion!)}
                            >
                                <Eye className="h-4 w-4 mr-2" /> Preview
                            </Button>
                            <Button
                                onClick={() => {
                                    handleRestoreVersion(selectedVersion!);
                                    setCodeViewOpen(false);
                                }}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" /> Restore
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}