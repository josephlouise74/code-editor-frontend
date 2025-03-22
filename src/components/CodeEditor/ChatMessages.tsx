import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Play, Pause, Volume2, Mic } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
}

interface AudioPlayerProps {
    src: string;
    duration?: number;
    isCompact?: boolean;
}

const AudioPlayer = ({ src, duration = 0, isCompact = false }: AudioPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration);
    const [isLoading, setIsLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        const handleLoadedMetadata = () => {
            setAudioDuration(audio.duration);
            setIsLoading(false);
            console.log('Audio loaded, duration:', audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = (e: ErrorEvent) => {
            console.error('Audio error:', e);
            setIsPlaying(false);
            setIsLoading(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
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
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleSliderChange = (newValue: number[]) => {
        if (!audioRef.current || isLoading) return;
        const newTime = newValue[0];
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isCompact) {
        return (
            <div className="flex items-center space-x-2 min-w-[120px]">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    className="w-8 h-8 p-0 rounded-full hover:bg-primary/10"
                >
                    {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                </Button>
                <div className="flex flex-col text-xs">
                    <span className="opacity-70">Voice message</span>
                    <span className="opacity-50">
                        {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 min-w-[200px] p-2">
            <div className="flex items-center space-x-3">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    className="w-10 h-10 p-0 rounded-full hover:bg-primary/10"
                >
                    {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : isPlaying ? (
                        <Pause className="h-5 w-5" />
                    ) : (
                        <Play className="h-5 w-5" />
                    )}
                </Button>
                <Volume2 className="h-4 w-4 opacity-70" />
                <div className="flex-grow">
                    <Slider
                        value={[currentTime]}
                        max={audioDuration}
                        step={0.1}
                        onValueChange={handleSliderChange}
                        disabled={isLoading}
                        className="cursor-pointer"
                    />
                </div>
            </div>
            <div className="flex justify-between text-xs opacity-70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
            </div>
        </div>
    );
};

export function ChatMessages({ messages, userData, roomId, onNewMessage }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);

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

    const renderMessage = (message: Message, isSelf: boolean) => {
        const messageClass = cn(
            "px-4 py-2 rounded-2xl max-w-full",
            isSelf ? "bg-blue-600 text-white" : "bg-muted/60"
        );

        return (
            <div className={messageClass}>
                {message.type === 'voice' ? (
                    <AudioPlayer
                        src={message.content}
                        duration={message.duration}
                        isCompact={true}
                    />
                ) : (
                    <div className="break-words whitespace-pre-wrap text-sm">
                        {message.content}
                    </div>
                )}
                <div className={cn(
                    "text-[10px] mt-1",
                    isSelf ? "text-blue-100" : "text-muted-foreground"
                )}>
                    {format(getPhilippineTime(message.timestamp), "h:mm a")}
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

    return (
        <div className="relative flex-grow">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground py-8">
                            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                            <p className="text-sm">Start a conversation!</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                            <div className="flex justify-center my-6">
                                <div className="bg-muted/30 rounded-full px-4 py-1 text-xs text-muted-foreground">
                                    {date}
                                </div>
                            </div>
                            {dateMessages.map((message, index) => {
                                const isSelf = message.userId === userData?.id;
                                const showAvatar = index === 0 ||
                                    dateMessages[index - 1]?.userId !== message.userId;

                                // Create a unique key for each message container
                                const messageKey = `${date}-${message.uid}-${index}`;

                                return (
                                    <div
                                        key={messageKey}
                                        className={`mb-4 flex ${isSelf ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[75%] ${isSelf ? "items-end" : "items-start"} flex flex-col`}>
                                            {!isSelf && showAvatar && (
                                                <div className="flex items-center mb-1 ml-1">
                                                    <Avatar className="h-6 w-6 mr-2">
                                                        <AvatarFallback className="bg-primary/10 text-xs">
                                                            {getInitials(message.userName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium">
                                                        {message.userName}
                                                    </span>
                                                </div>
                                            )}
                                            {renderMessage(message, isSelf)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </ScrollArea>

            {hasNewMessages && (
                <button
                    onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="absolute bottom-2 right-4 bg-primary text-white rounded-full px-3 py-1 text-xs shadow-md animate-bounce"
                >
                    New messages ↓
                </button>
            )}
        </div>
    );
}
