import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { toast } from "react-toastify";

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    token: string;
}

export function ShareDialog({ isOpen, onClose, roomId, token }: ShareDialogProps) {
    const [copied, setCopied] = React.useState(false);

    // Generate share URL with participant parameter
    const shareUrl = React.useMemo(() => {
        const baseUrl = "https://code-editor-frontend-navy.vercel.app";
        const url = new URL(`${baseUrl}/room/${roomId}`);
        url.searchParams.set('token', token);
        url.searchParams.set('participant', 'true');
        url.searchParams.set('collaborator', 'true');
        return url.toString();
    }, [roomId, token]);


    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy link');
            console.error('Failed to copy:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Room</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Share this link with others to collaborate in real-time:
                    </p>
                    <div className="flex items-center space-x-2">
                        <Input
                            readOnly
                            value={shareUrl}
                            className="flex-1"
                        />
                        <Button
                            size="sm"
                            onClick={handleCopy}
                            className="px-3"
                        >
                            {copied ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}