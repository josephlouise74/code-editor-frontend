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
import { useSearchParams } from "next/navigation";

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
    messageType: string;
}

interface MessageTypes {
    HOST: 'host';
    MEMBER: 'member';
    SELF: 'self';
}

const MESSAGE_TYPES: MessageTypes = {
    HOST: 'host',
    MEMBER: 'member',
    SELF: 'self'
} as const;

const getInitials = (name: string) => {
    if (!name) return "??";
    return name
        .split(' ')
        .map(part => part?.[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const getPhilippineTime = (timestamp: number) => {
    try {
        const date = new Date(timestamp);
        return toZonedTime(date, 'Asia/Manila');
    } catch (error) {
        console.error("Error converting timestamp:", error);
        return new Date(timestamp);
    }
};

const AudioPlayer = ({ src, duration = 0, isCompact = false, messageType }: AudioPlayerProps) => {
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

    const getStylesByMessageType = () => {
        switch (messageType) {
            case MESSAGE_TYPES.SELF:
                return {
                    container: "bg-blue-500/10",
                    button: "bg-blue-500 hover:bg-blue-600 text-white",
                    text: "text-blue-700 dark:text-blue-300",
                    duration: "bg-blue-500/20 text-blue-700"
                };
            case MESSAGE_TYPES.HOST:
                return {
                    container: "bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10",
                    button: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
                    text: "text-indigo-700 dark:text-indigo-300",
                    duration: "bg-indigo-500/20 text-indigo-700"
                };
            default:
                return {
                    container: "bg-gray-100 dark:bg-gray-800",
                    button: "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600",
                    text: "text-gray-700 dark:text-gray-300",
                    duration: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                };
        }
    };

    const styles = getStylesByMessageType();

    return (
        <div className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            styles.container
        )}>
            <button
                onClick={togglePlayPause}
                disabled={isLoading}
                className={cn(
                    "flex items-center justify-center rounded-full w-8 h-8 transition-all duration-200",
                    styles.button
                )}
            >
                {isLoading ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4" />
                )}
            </button>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 opacity-60" />
                    <span className={cn("text-xs font-medium", styles.text)}>
                        Voice message
                    </span>
                </div>

                <div className={cn(
                    "flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                    styles.duration
                )}>
                    {duration ? `${Math.round(duration)}s` : '•••'}
                </div>
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
    const searchParams = useSearchParams();

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

    const isOwnMessage = (messageEmail?: string) => {
        if (!messageEmail) return false;

        const participantRole = searchParams.get('participantRole');
        const currentUserEmail = participantRole === 'participant'
            ? searchParams.get('participantEmail')
            : searchParams.get('adminEmail');

        return messageEmail.toLowerCase() === currentUserEmail?.toLowerCase();
    };

    const renderMessage = (message: Message) => {
        const isSelf = message.isSelf || isOwnMessage(message.email);
        const isHost = message.role === 'host';
        const messageType = isSelf ? MESSAGE_TYPES.SELF : isHost ? MESSAGE_TYPES.HOST : MESSAGE_TYPES.MEMBER;

        const messageStyles = {
            [MESSAGE_TYPES.SELF]: {
                container: "justify-end",
                message: "bg-blue-500 text-white ml-auto rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl rounded-br-none",
                name: "text-blue-600 dark:text-blue-400",
                wrapper: "items-end"
            },
            [MESSAGE_TYPES.HOST]: {
                container: "justify-start",
                message: "bg-indigo-600 text-white rounded-tr-2xl rounded-tl-2xl rounded-br-2xl rounded-bl-none",
                name: "text-indigo-600 dark:text-indigo-400",
                wrapper: "items-start"
            },
            [MESSAGE_TYPES.MEMBER]: {
                container: "justify-start",
                message: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl rounded-bl-none",
                name: "text-gray-600 dark:text-gray-400",
                wrapper: "items-start"
            },
        };

        const style = messageStyles[messageType];

        return (
            <div className={cn("flex gap-2 mx-4 mb-2 items-end group", style.container)}>
                {!isSelf && (
                    <MessageAvatar
                        userName={message.userName}
                        isHost={isHost}
                    />
                )}

                <div className={cn("flex flex-col max-w-[75%]", style.wrapper)}>
                    {!isSelf && (
                        <MessageHeader
                            userName={message.userName}
                            isHost={isHost}
                            className={style.name}
                        />
                    )}

                    <div className={cn(
                        "px-4 py-3 shadow-sm relative",
                        style.message,
                        message.type === 'voice' && "p-2",
                        "transition-all duration-200 hover:shadow-md"
                    )}>
                        {message.type === 'voice' ? (
                            <AudioPlayer
                                src={message.content}
                                duration={message.duration}
                                isCompact={true}
                                messageType={messageType}
                            />
                        ) : (
                            <div className="text-sm leading-relaxed break-words">
                                {message.content}
                            </div>
                        )}

                        <MessageTimestamp
                            timestamp={message.timestamp}
                            isHost={isHost}
                            isSelf={isSelf}
                            getTime={getPhilippineTime}
                        />
                    </div>
                </div>

                {isSelf && (
                    <MessageAvatar
                        userName={message.userName}
                        isHost={isHost}
                    />
                )}
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

const MessageAvatar = ({ userName, isHost }: { userName: string; isHost: boolean }) => (
    <div className="relative group-hover:scale-105 transition-transform duration-200">
        <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback
                className={cn(
                    "text-xs font-medium",
                    isHost
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 border border-indigo-500"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                )}
            >
                {getInitials(userName)}
            </AvatarFallback>
        </Avatar>
    </div>
);

const MessageHeader = ({ userName, isHost, className }: { userName: string; isHost: boolean; className: string }) => (
    isHost ? (
        <div className="flex items-center gap-1.5 mb-1">
            <div className="flex items-center px-2 py-0.5 rounded-full 
                          bg-indigo-100 dark:bg-indigo-900/30">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {userName} • Host
                </span>
            </div>
        </div>
    ) : (
        <span className={cn("text-xs font-medium mb-1 px-1", className)}>
            {userName}
        </span>
    )
);

const MessageTimestamp = ({ timestamp, isHost, isSelf, getTime }: {
    timestamp: number;
    isHost: boolean;
    isSelf: boolean;
    getTime: (timestamp: number) => Date;
}) => (
    <div className={cn(
        "text-[10px] mt-1",
        isSelf ? "text-right" : "text-left",
        isSelf || isHost ? "text-white/70" : "text-gray-500"
    )}>
        {format(getTime(timestamp), "h:mm a")}
    </div>
);
