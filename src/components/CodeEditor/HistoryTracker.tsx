import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { History, RotateCcw, Eye, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { User, Clock } from "lucide-react"; // Add these imports
import { toast } from "react-toastify";

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

// Update the HistoryData interface
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
    onInitialLoad?: () => void; // Add this prop
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
}: any) {
    const history = historyData?.history || [];
    const pagination = historyData?.pagination || defaultPagination;
    const itemsPerPageOptions = [5, 10, 15, 20];
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshData = async () => {
        try {
            setIsRefreshing(true);
            await fetchHistory();
        } catch (error) {
            console.error('Error refreshing history:', error);
            toast.error('Failed to refresh history');
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (onInitialLoad) {
            onInitialLoad();
            fetchHistory();
        }
        console.log("history", history)
    }, []);

    if (!historyData) {
        return (
            <Card className="w-full max-w-[300px]">
                <CardContent className="py-6 text-center text-muted-foreground">
                    No history data available
                </CardContent>
            </Card>
        );
    }

    // Update the card return statement
    return (
        <Card className="w-full max-w-[300px] shadow-lg relative z-[100]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 sticky top-0 bg-background z-[101] border-b">
                <CardTitle className="text-sm font-medium flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    History ({pagination.totalItems || 0})
                </CardTitle>
                <div className="flex items-center gap-2">
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
                </div>
            </CardHeader>

            {/* Update the history item card */}
            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    <div className="space-y-2 p-4">
                        {history.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4 text-sm">
                                No history records found
                            </div>
                        ) : (
                            history.map((version: any) => (
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
                                                <Clock className="h-3 w-3 mr-1" />
                                                {format(new Date(version.timestamp), "MMM d, h:mm a")}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                                {version.participantEmail || 'No email'}
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
                                                            onClick={() => onPreviewVersion(version)}
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
                                                            onClick={() => onRestoreVersion(version)}
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
    );
}