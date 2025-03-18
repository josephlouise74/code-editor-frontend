import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
    email?: string;
    isSelf?: boolean;
    type?: string;
    system?: boolean;
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

export function ChatMessages({ messages, userData, roomId, onNewMessage }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0 && messages.length > prevMessagesLengthRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setHasNewMessages(false);
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    // Initial scroll to bottom
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView();
        }
    }, []);

    // Check if user has scrolled up and new messages arrive
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

    // Call onNewMessage when new messages arrive
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current && onNewMessage && messages.length > 0) {
            const newMessage = messages[messages.length - 1];
            if (!newMessage.isSelf) {
                onNewMessage(newMessage);
            }
        }
    }, [messages, onNewMessage]);

    const getPhilippineTime = (timestamp: number) => {
        try {
            const date = new Date(timestamp);
            const philippineTime = toZonedTime(date, 'Asia/Manila');
            return philippineTime;
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

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );

    // Group messages by date using Philippine time
    const messagesByDate = sortedMessages.reduce<Record<string, Message[]>>(
        (groups, message) => {
            try {
                const philTime = getPhilippineTime(message.timestamp);
                const date = format(philTime, "MMMM d, yyyy");
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(message);
                return groups;
            } catch (error) {
                console.error("Error grouping message:", error, message);
                const date = "Unknown Date";
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(message);
                return groups;
            }
        },
        {}
    );

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setHasNewMessages(false);
    };

    // Group consecutive messages from the same user
    const groupConsecutiveMessages = (messages: Message[]) => {
        const groupedMessages: { userId: string; messages: Message[] }[] = [];

        messages.forEach((message) => {
            const lastGroup = groupedMessages[groupedMessages.length - 1];

            if (lastGroup && lastGroup.userId === message.userId && !message.system) {
                lastGroup.messages.push(message);
            } else {
                groupedMessages.push({
                    userId: message.userId,
                    messages: [message]
                });
            }
        });

        return groupedMessages;
    };

    return (
        <div className="relative flex-grow">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground py-8 max-w-md">
                            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                            <p className="text-sm">Start a conversation by sending the first message.</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(messagesByDate).map(([date, dateMessages]) => {
                        const groupedMessages = groupConsecutiveMessages(dateMessages);

                        return (
                            <div key={date}>
                                <div className="flex justify-center my-6">
                                    <div className="bg-muted/30 rounded-full px-4 py-1 text-xs text-muted-foreground">
                                        {date}
                                    </div>
                                </div>

                                {groupedMessages.map((group, groupIndex) => {
                                    const firstMessage = group.messages[0];
                                    const isSelf = firstMessage.isSelf || firstMessage.userId === userData?.id;
                                    const isSystem = firstMessage.system;

                                    if (isSystem) {
                                        return (
                                            <div key={`group-${groupIndex}`} className="flex justify-center my-4">
                                                <div className="bg-gray-100 text-gray-600 rounded-full px-4 py-1 text-xs">
                                                    {firstMessage.content}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={`group-${groupIndex}`}
                                            className={`mb-6 flex ${isSelf ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[75%] ${isSelf ? "items-end" : "items-start"} flex flex-col`}>
                                                {!isSelf && (
                                                    <div className="flex items-center mb-1 ml-1">
                                                        <Avatar className="h-6 w-6 mr-2">
                                                            <AvatarFallback className="bg-primary/10 text-xs">
                                                                {getInitials(firstMessage.userName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium">
                                                            {firstMessage.userName}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"} gap-1`}>
                                                    {group.messages.map((message, messageIndex) => (
                                                        <div
                                                            key={message.id}
                                                            className={`
                                                                px-4 py-2 
                                                                ${isSelf ? "bg-blue-600 text-white" : "bg-muted/60"}
                                                                ${messageIndex === 0 && isSelf ? "rounded-tr-2xl" : ""}
                                                                ${messageIndex === 0 && !isSelf ? "rounded-tl-2xl" : ""}
                                                                ${messageIndex === group.messages.length - 1 && isSelf ? "rounded-br-sm rounded-bl-2xl" : ""}
                                                                ${messageIndex === group.messages.length - 1 && !isSelf ? "rounded-bl-sm rounded-br-2xl" : ""}
                                                                ${messageIndex !== 0 && messageIndex !== group.messages.length - 1 ? "rounded-2xl" : ""}
                                                                ${group.messages.length === 1 ? "rounded-2xl" : ""}
                                                                ${group.messages.length === 1 && isSelf ? "rounded-br-sm" : ""}
                                                                ${group.messages.length === 1 && !isSelf ? "rounded-bl-sm" : ""}
                                                                max-w-full
                                                            `}
                                                        >
                                                            <div className="break-words whitespace-pre-wrap text-sm">
                                                                {message.content}
                                                            </div>

                                                            {messageIndex === group.messages.length - 1 && (
                                                                <div
                                                                    className={`
                                                                        text-[10px] mt-1
                                                                        ${isSelf ? "text-blue-100" : "text-muted-foreground"}
                                                                    `}
                                                                >
                                                                    {format(getPhilippineTime(message.timestamp), "h:mm a")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </ScrollArea>

            {/* New messages indicator */}
            {hasNewMessages && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-2 right-4 bg-primary text-white rounded-full px-3 py-1 text-xs shadow-md animate-bounce"
                >
                    New messages ↓
                </button>
            )}
        </div>
    );
}