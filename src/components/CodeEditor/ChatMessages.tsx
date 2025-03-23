import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { Mic, Pause, Play, Volume2, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

interface Message {
    uid: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
    email?: string;
    isSelf?: boolean;
    type?: 'text' | 'voice';
    duration?: number;
    filePath?: string;
    role?: 'host' | 'participant';
}

interface ChatMessagesProps {
    messages: Message[];
    userData: {
        id: string;
        email: string;
        name: string;
    };
    roomId: string;
    onNewMessage?: (message: Message) => void;
    participantRole?: string;
    participantEmail?: string;
    participantName?: string;
    adminEmail?: string;
    host?: string;
}

interface AudioPlayerProps {
    src: string;
    duration?: number;
    isCompact?: boolean;
    isOwn?: boolean;
}

const AudioPlayer = ({ src, duration = 0, isCompact = false, isOwn = false }: AudioPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        const handleLoadedMetadata = () => {
            setIsLoading(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        const handleError = (e: ErrorEvent) => {
            console.error('Audio error:', e);
            setIsPlaying(false);
            setIsLoading(false);
            toast.error('Unable to play audio message');
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.remove();
        };
    }, [src]);

    const togglePlayPause = () => {
        if (!audioRef.current || isLoading) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Stop all other playing audio elements
            document.querySelectorAll('audio').forEach(audio => {
                if (audio !== audioRef.current) audio.pause();
            });

            audioRef.current.play().catch(err => {
                console.error('Error playing audio:', err);
                toast.error('Failed to play audio');
            });
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className={cn(
            "flex items-center gap-3",
            "bg-opacity-50 rounded-full px-3 py-1.5",
            isOwn
                ? "bg-white/10"
                : "bg-gray-100 dark:bg-gray-700"
        )}>
            <button
                onClick={togglePlayPause}
                disabled={isLoading}
                className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    "w-7 h-7",
                    isOwn
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500",
                    "shadow-sm"
                )}
            >
                {isLoading ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                ) : isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                ) : (
                    <Play className="h-3.5 w-3.5" />
                )}
            </button>

            <div className="flex items-center gap-2">
                <Mic className="h-3.5 w-3.5 opacity-60" />
                <span className={cn(
                    "text-xs font-medium",
                    isOwn ? "text-white/80" : "text-gray-600 dark:text-gray-300"
                )}>
                    Voice message
                </span>
            </div>

            <div className={cn(
                "flex items-center justify-center px-2 py-0.5 rounded-full text-[10px]",
                "min-w-[40px]",
                isOwn
                    ? "bg-white/20 text-white/90"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
            )}>
                {duration ? `${Math.round(duration)}s` : '•••'}
            </div>
        </div>
    );
};

export function ChatMessages({ messages, userData, roomId, onNewMessage, participantRole, participantEmail, participantName, adminEmail, host }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const loadingTriggerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setHasNewMessages(false);
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollArea;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

            if (!isAtBottom && messages.length > prevMessagesLengthRef.current) {
                setHasNewMessages(true);
            } else if (isAtBottom) {
                setHasNewMessages(false);
            }
        };

        scrollArea.addEventListener('scroll', handleScroll);
        return () => scrollArea.removeEventListener('scroll', handleScroll);
    }, [messages.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loading) {
                    loadMoreMessages();
                }
            },
            { threshold: 0.5 }
        );

        if (loadingTriggerRef.current) {
            observer.observe(loadingTriggerRef.current);
        }

        return () => observer.disconnect();
    }, [loading]);

    const getPhilippineTime = (timestamp: number) => {
        try {
            const date = new Date(timestamp);
            return toZonedTime(date, 'Asia/Manila');
        } catch (error) {
            console.error("Error converting timestamp:", error);
            return new Date(timestamp);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name
            .split(' ')
            .map(part => part?.[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isOwnMessage = (messageEmail?: string) => {
        if (!messageEmail) return false;

        const userEmail = participantRole === 'participant'
            ? participantEmail
            : adminEmail;

        return messageEmail.toLowerCase() === userEmail?.toLowerCase();
    };

    const renderMessage = (message: Message) => {
        const isSelf = message.isSelf || isOwnMessage(message.email);
        const isHost = message.role === 'host';
        const isMember = !isSelf && !isHost;

        const messageClass = cn(
            "px-4 py-3 rounded-lg max-w-[85%] shadow-sm relative",
            isSelf ? [
                "bg-blue-500",
                "text-white",
                "ml-auto",
                "hover:bg-blue-600",
                "rounded-br-none"
            ] : isHost ? [
                "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500",
                "text-white",
                "border border-indigo-400/20",
                "shadow-lg",
                "hover:shadow-xl hover:scale-[1.02]",
                "transition-all duration-300",
                "rounded-bl-none"
            ] : [
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-900 dark:text-gray-100",
                "rounded-bl-none",
                "border border-gray-200 dark:border-gray-700"
            ],
            "transition-all duration-200"
        );

        const containerClass = cn(
            "flex gap-2 mx-4 mb-2",
            isSelf ? "justify-end" : "justify-start",
            "items-end group"
        );

        const MemberBadge = () => (
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {message.userName}
                </span>
            </div>
        );

        const HostBadge = () => (
            <div className="flex items-center gap-1.5 mb-1">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full 
                              bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-500/20">
                    <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 0 1 .707.293l7 7a1 1 0 0 1-1.414 1.414L10 4.414l-6.293 6.293a1 1 0 0 1-1.414-1.414l7-7A1 1 0 0 1 10 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-indigo-500">Host</span>
                </div>
            </div>
        );

        return (
            <div className={containerClass}>
                {!isSelf && (
                    <div className="relative group-hover:scale-105 transition-transform duration-200">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback
                                className={cn(
                                    "text-xs font-medium",
                                    isHost
                                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 border-2 border-indigo-500"
                                        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                )}
                            >
                                {getInitials(message.userName)}
                            </AvatarFallback>
                        </Avatar>
                        {isHost && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full
                                          flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                )}

                <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                    {!isSelf && (isHost ? <HostBadge /> : <MemberBadge />)}

                    <div className={cn(
                        messageClass,
                        message.type === 'voice' && "p-2"
                    )}>
                        {isHost && (
                            <div className="absolute top-0 right-0 w-full h-1 
                                          bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 
                                          opacity-50" />
                        )}

                        {message.type === 'voice' ? (
                            <AudioPlayer
                                src={message.content}
                                duration={message.duration}
                                isCompact={true}
                                isOwn={isSelf || isHost}
                            />
                        ) : (
                            <div className="relative">
                                <div className="text-sm leading-relaxed">
                                    {message.content}
                                </div>
                            </div>
                        )}

                        <div className={cn(
                            "text-[10px] mt-2 text-right flex items-center justify-end gap-1",
                            isSelf || isHost ? "text-white/70" : "text-gray-500"
                        )}>
                            {format(getPhilippineTime(message.timestamp), "h:mm a")}
                            {isHost && (
                                <svg className="w-3 h-3 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
        const date = format(getPhilippineTime(message.timestamp), "MMMM d, yyyy");
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    const loadMoreMessages = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // Call your API or data fetching function here
            // Example: await fetchMoreMessages(page + 1);
            setPage(prev => prev + 1);
        } catch (error) {
            console.error('Error loading more messages:', error);
            toast.error('Failed to load more messages');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex-grow pb-4">
            <ScrollArea className="h-[calc(95vh-180px)]" ref={scrollAreaRef}>
                <div className="space-y-6 px-2">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[300px]">
                            <div className="text-center p-8 rounded-xl bg-slate-50 dark:bg-slate-800/50
                                            border border-slate-200/20 dark:border-slate-700/20">
                                <Mic className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                                <h3 className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-200">
                                    No messages yet
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Start a conversation!
                                </p>
                            </div>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, dateMessages]) => (
                            <div key={`date-group-${date}`} className="space-y-4">
                                <div className="flex justify-center sticky top-0 z-10 py-2">
                                    <div className="bg-white/80 dark:bg-slate-800/80 shadow-sm 
                                                  rounded-full px-4 py-1.5 text-xs font-medium 
                                                  text-slate-600 dark:text-slate-300 
                                                  backdrop-blur-sm border border-slate-200/20">
                                        {date}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {dateMessages.map((message) => (
                                        <div key={`message-${message.uid || `${date}-${message.timestamp}-${message.userId}`}`}>
                                            {renderMessage(message)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div ref={messagesEndRef} className="h-4" />
            </ScrollArea>

            {hasNewMessages && (
                <button
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="absolute bottom-4 right-4 
                               bg-blue-500 hover:bg-blue-600 
                               text-white rounded-full px-4 py-2 
                               text-xs font-medium shadow-lg 
                               transition-all duration-200
                               flex items-center gap-2"
                >
                    New messages
                    <ChevronDown className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
