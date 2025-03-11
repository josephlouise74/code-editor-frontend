import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { History, RotateCcw, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useEffect } from "react";
import { User, Clock } from "lucide-react"; // Add these imports

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
    roomName: string;
    timestamp: Date;
    version: number;
    userData: UserData; // Add this field
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
    onInitialLoad
}: HistoryTrackerProps) {
    const history = historyData?.history || [];
    const pagination = historyData?.pagination || defaultPagination;
    const itemsPerPageOptions = [5, 10, 15, 20];

    useEffect(() => {
        if (onInitialLoad) {
            onInitialLoad();
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

    return (
        <Card className="w-full max-w-[300px] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 sticky top-0 bg-background z-50 border-b">
                <CardTitle className="text-sm font-medium flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    History
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                    {pagination.totalItems || 0}
                </Badge>
            </CardHeader>

            <div className="px-4 py-2 border-b">
                <Select
                    value={pagination.itemsPerPage?.toString()}
                    onValueChange={(value) => onLimitChange(Number(value))}
                >
                    <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {itemsPerPageOptions.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                                {option} per page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

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
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Badge variant="outline" className="text-[10px]">
                                                    v{version.version}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {version.modifiedBy || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-[10px] text-muted-foreground">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {format(new Date(version.timestamp), "MMM d, h:mm a")}
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

            <CardFooter className="flex items-center justify-between py-2 px-4 border-t">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => pagination.prevPage && onPageChange(pagination.prevPage)}
                    disabled={!pagination.hasPrevPage}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                    {pagination.currentPage}/{pagination.totalPages}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => pagination.nextPage && onPageChange(pagination.nextPage)}
                    disabled={!pagination.hasNextPage}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}