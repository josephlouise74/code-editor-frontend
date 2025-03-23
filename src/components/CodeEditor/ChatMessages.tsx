import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { Mic, Pause, Play, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, useMemo, useCallback, JSX } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";

// Define clear type interfaces
interface Message {
    uid: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number | string;
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

type MessageType = 'host' | 'member' | 'self';

interface MessageStyles {
    container: string;
    button: string;
    text: string;
    duration: string;
}

const MESSAGE_TYPES = {
    HOST: 'host' as MessageType,
    MEMBER: 'member' as MessageType,
    SELF: 'self' as MessageType
};

const getInitials = (name: string): string => {
    if (!name) return "??";
    return name
        .split(' ')
        .map(part => part?.[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const getPhilippineTime = (timestamp: number | string): Date => {
    try {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
        return toZonedTime(date, 'Asia/Manila');
    } catch (error) {
        console.error("Error converting timestamp:", error);
        return typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    }
};

// Voice message features
const voiceMessageFeatures = {
    maxDuration: 300, // 5 minutes
    waveformBars: 40,
    supportedFormats: ['audio/webm', 'audio/mp4'],
    compressionOptions: {
        sampleRate: 22050,
        bitRate: 96000
    }
};

// Playback features
const playbackFeatures = {
    speeds: [0.5, 1, 1.5, 2],
    volumeControl: true,
    rememberPlaybackPosition: true,
    autoPlayNext: false
};

// Improved audio player with better error handling and URL validation
const AudioPlayer = ({ src, duration = 0, isCompact = false, messageType }: AudioPlayerProps): JSX.Element => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [audioError, setAudioError] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Add console logs for debugging
    const getValidUrl = useCallback((url: string): string => {
        console.log('Voice Message Raw Data:', {
            originalUrl: url,
            duration: duration,
            messageType: messageType
        });

        if (!url) return '';

        // Remove @ symbol and trim whitespace
        const cleanedUrl = url.replace(/^@/, '').trim();

        console.log('Processed URL:', {
            cleanedUrl,
            hasSupabase: cleanedUrl.includes('supabase.co'),
            hasVoiceMessages: cleanedUrl.includes('/voice-messages/')
        });

        // Validate if it's a Supabase URL
        if (cleanedUrl.includes('supabase.co') && cleanedUrl.includes('/voice-messages/')) {
            return cleanedUrl;
        }

        console.error("Invalid voice message URL:", url);
        return '';
    }, []);

    const cleanUrl = useMemo(() => getValidUrl(src), [src, getValidUrl]);

    useEffect(() => {
        console.log('Audio Setup:', {
            cleanUrl,
            isLoading,
            hasError: audioError,
            currentTime,
            isPlaying
        });

        if (!cleanUrl) {
            setAudioError(true);
            setIsLoading(false);
            return;
        }

        const audio = new Audio();
        audioRef.current = audio;

        const setupAudio = () => {
            // Set CORS and type hints for better compatibility
            audio.crossOrigin = 'anonymous';
            audio.preload = 'metadata';

            // Add event listeners
            const handleCanPlay = () => {
                setIsLoading(false);
                setAudioError(false);
            };

            const handleLoadStart = () => {
                setIsLoading(true);
            };

            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
            };

            const handleEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };

            const handleError = () => {
                console.error('Audio error:', cleanUrl);
                setAudioError(true);
                setIsLoading(false);
            };

            audio.addEventListener('loadstart', handleLoadStart);
            audio.addEventListener('canplay', handleCanPlay);
            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', handleEnded);
            audio.addEventListener('error', handleError);

            // Set source and load
            try {
                audio.src = cleanUrl;
                audio.load();
            } catch (error) {
                console.error('Error loading audio:', error);
                setAudioError(true);
                setIsLoading(false);
            }

            return () => {
                audio.removeEventListener('loadstart', handleLoadStart);
                audio.removeEventListener('canplay', handleCanPlay);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
            };
        };

        const cleanup = setupAudio();

        return () => {
            cleanup();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, [cleanUrl]);

    // Toggle play/pause with better error handling
    const togglePlayPause = useCallback(async () => {
        if (!audioRef.current || isLoading || audioError) return;

        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                // Stop all other playing audio
                document.querySelectorAll('audio').forEach(audio => {
                    audio.pause();
                });

                // Attempt to play with proper error handling
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (error) {
                    console.error('Playback error:', error);
                    setAudioError(true);
                    toast.error('Failed to play audio. Try refreshing the page.');
                }
            }
        } catch (error) {
            console.error('Toggle play/pause error:', error);
        }
    }, [isPlaying, isLoading, audioError]);

    const formatTime = useCallback((time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const styles = useMemo((): MessageStyles => getStylesByMessageType(messageType), [messageType]);

    // Render optimized UI
    return (
        <div className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            styles.container
        )}>
            <button
                onClick={togglePlayPause}
                disabled={isLoading || audioError}
                className={cn(
                    "flex items-center justify-center rounded-full w-8 h-8",
                    "transition-all duration-200",
                    styles.button,
                    (isLoading || audioError) && "opacity-50 cursor-not-allowed"
                )}
                title={audioError ? "Failed to load audio" : isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
                type="button"
            >
                {isLoading ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4" />
                )}
            </button>

            <div className="flex flex-col gap-1 flex-grow min-w-[120px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Mic className="h-3.5 w-3.5 opacity-60" />
                        <span className={cn("text-xs font-medium",)}>
                            Voice message
                        </span>
                    </div>
                    {!audioError && (
                        <span className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full text-green-500",

                        )}>
                            {isPlaying ? formatTime(currentTime) : formatTime(duration)}
                        </span>
                    )}
                </div>

                {isPlaying && !audioError && (
                    <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-current transition-all duration-200"
                            style={{
                                width: `${(currentTime / (duration || 1)) * 100}%`,
                                opacity: 0.5
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Styles utility function with proper typing
const getStylesByMessageType = (messageType: string): MessageStyles => {
    switch (messageType) {
        case MESSAGE_TYPES.SELF:
            return {
                container: "bg-blue-500/10 dark:bg-blue-500/20",
                button: "bg-blue-500 hover:bg-blue-600 text-white",
                text: "text-blue-700 dark:text-blue-300",
                duration: "bg-blue-500/20 text-blue-700 dark:text-blue-300"
            };
        case MESSAGE_TYPES.HOST:
            return {
                container: "bg-indigo-500/10 dark:bg-indigo-500/20",
                button: "bg-indigo-500 hover:bg-indigo-600 text-white",
                text: "text-indigo-700 dark:text-indigo-300",
                duration: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
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

// Improved utility components with explicit types
interface MessageAvatarProps {
    userName: string;
    isHost: boolean;
}

const MessageAvatar = ({ userName, isHost }: MessageAvatarProps): JSX.Element => (
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

interface MessageHeaderProps {
    userName: string;
    isHost: boolean;
    className: string;
}

const MessageHeader = ({ userName, isHost, className }: MessageHeaderProps): JSX.Element => (
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

interface MessageTimestampProps {
    timestamp: number | string;
    isHost: boolean;
    isSelf: boolean;
    getTime: (timestamp: number | string) => Date;
}

const MessageTimestamp = ({ timestamp, isHost, isSelf, getTime }: MessageTimestampProps): JSX.Element => (
    <div className={cn(
        "text-[10px] mt-1",
        isSelf ? "text-right" : "text-left",
        isSelf || isHost ? "text-white/70" : "text-gray-500"
    )}>
        {format(getTime(timestamp), "h:mm a")}
    </div>
);

const voiceMessageStyles = {
    container: cn(
        "rounded-xl shadow-lg",
        "backdrop-filter backdrop-blur-sm",
        "border border-opacity-10",
        "transition-all duration-200"
    ),
    button: cn(
        "hover:scale-105",
        "active:scale-95",
        "transition-transform"
    ),
    waveform: cn(
        "flex items-center gap-0.5",
        "h-8 w-full",
        "opacity-75"
    ),
    timer: cn(
        "font-mono text-sm",
        "tabular-nums"
    )
};

export function ChatMessages({ messages, userData, roomId, onNewMessage, participantRole, participantEmail, participantName, adminEmail, host }: ChatMessagesProps): JSX.Element {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasNewMessages, setHasNewMessages] = useState<boolean>(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef<number>(messages.length);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
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

    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
        };

        scrollToBottom();

        if (messages.length > prevMessagesLengthRef.current) {
            scrollToBottom();
        }

        const timeoutId = setTimeout(scrollToBottom, 100);

        return () => clearTimeout(timeoutId);
    }, [messages]);

    const isOwnMessage = useCallback((messageEmail?: string): boolean => {
        if (!messageEmail) return false;

        const participantRole = searchParams.get('participantRole');
        const currentUserEmail = participantRole === 'participant'
            ? searchParams.get('participantEmail')
            : searchParams.get('adminEmail');

        return messageEmail.toLowerCase() === currentUserEmail?.toLowerCase();
    }, [searchParams]);

    const renderMessage = useCallback((message: Message): JSX.Element => {

        console.log('Rendering Message 3333333333333333333333:', message);
        const isSelf = message.isSelf || isOwnMessage(message.email);
        const isHost = message.role === 'host';
        const messageType = isSelf ? MESSAGE_TYPES.SELF : isHost ? MESSAGE_TYPES.HOST : MESSAGE_TYPES.MEMBER;

        interface MessageStylesConfig {
            container: string;
            message: string;
            name: string;
            wrapper: string;
        }

        const messageStyles: Record<MessageType, MessageStylesConfig> = {
            self: {
                container: "justify-end",
                message: "bg-blue-500 text-white ml-auto rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl rounded-br-none",
                name: "text-blue-600 dark:text-blue-400",
                wrapper: "items-end"
            },
            host: {
                container: "justify-start",
                message: "bg-indigo-600 text-white rounded-tr-2xl rounded-tl-2xl rounded-br-2xl rounded-bl-none",
                name: "text-indigo-600 dark:text-indigo-400",
                wrapper: "items-start"
            },
            member: {
                container: "justify-start",
                message: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl rounded-bl-none",
                name: "text-gray-600 dark:text-gray-400",
                wrapper: "items-start"
            }
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
                        {message.type === 'voice' && (
                            <>
                                {console.log('Rendering Voice Message:', {
                                    content: message.content,
                                    duration: message.duration,
                                    messageType,
                                    filePath: message.filePath
                                })}
                                <AudioPlayer
                                    src={message.content as any || ''}
                                    duration={message.duration}
                                    isCompact={true}
                                    messageType={messageType}
                                />
                            </>
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
    }, [isOwnMessage]);

    // Group messages by date
    const groupedMessages = useMemo(() => {
        return messages.reduce<Record<string, Message[]>>((groups, message) => {
            const date = format(getPhilippineTime(message.timestamp), "MMMM d, yyyy");
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {});
    }, [messages]);

    const loadMoreMessages = async (): Promise<void> => {
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
            <ScrollArea
                className="h-[calc(95vh-180px)]"
                ref={scrollAreaRef}
                scrollHideDelay={0}
            >
                <div className="space-y-6 px-2 min-h-full">
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
                                        <div key={`message-${message.uid || `${date}-${String(message.timestamp)}-${message.userId}`}`}>
                                            {renderMessage(message)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div
                    ref={messagesEndRef}
                    className="h-4"
                    style={{ float: 'left', clear: 'both' }}
                />
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