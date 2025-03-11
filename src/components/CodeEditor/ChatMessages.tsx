import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ChatMessage {
    uid: string;
    name: string;
    email: string;
    message: string;
    timestamp: string;
    isSelf?: boolean;
}

export interface ChatResponse {
    success: boolean;
    message: string;
    data: ChatMessage;
}


interface ChatMessagesProps {
    messages: ChatMessage[];
    userData: {
        email: string;
        name?: string;
        avatar?: string;
    };
}

export function ChatMessages({ messages, userData }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getPhilippineTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const philippineTime = toZonedTime(date, 'Asia/Manila');
        return philippineTime;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Sort messages by date
    const sortedMessages = [...messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group messages by date using Philippine time
    const messagesByDate = sortedMessages.reduce<Record<string, ChatMessage[]>>(
        (groups, message) => {
            const philTime = getPhilippineTime(message.timestamp);
            const date = format(philTime, "MMMM d, yyyy");
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        },
        {}
    );

    return (
        <ScrollArea className="flex-grow p-4">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground py-8 max-w-md">
                        <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                        <p className="text-sm">Start a conversation by sending the first message.</p>
                    </div>
                </div>
            ) : (
                Object.entries(messagesByDate).map(([date, dateMessages]) => (
                    <div key={date}>
                        <div className="flex justify-center my-6">
                            <div className="bg-muted/30 rounded-full px-4 py-1 text-xs text-muted-foreground">
                                {date}
                            </div>
                        </div>

                        {dateMessages.map((message, index) => {
                            const isSelf = message.email === userData.email;
                            const showSender =
                                index === 0 ||
                                dateMessages[index - 1]?.email !== message.email;

                            return (
                                <div
                                    key={message.uid}
                                    className={`mb-4 flex ${isSelf ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[70%] ${isSelf ? "items-end" : "items-start"} flex flex-col`}
                                    >
                                        {!isSelf && showSender && (
                                            <div className="flex items-center mb-1 ml-1">
                                                <Avatar className="h-6 w-6 mr-2">
                                                    <AvatarFallback className="bg-primary/10 text-xs">
                                                        {getInitials(message.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium">
                                                    {message.name}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={`
                                                px-4 py-2 rounded-2xl
                                                ${isSelf ? "bg-blue-600 text-white" : "bg-muted/60"}
                                                ${isSelf ? "rounded-br-sm" : "rounded-bl-sm"}
                                                max-w-full
                                            `}
                                        >
                                            <div className="break-words whitespace-pre-wrap text-sm">
                                                {message.message}
                                            </div>
                                            <div
                                                className={`
                                                    text-[10px] mt-1
                                                    ${isSelf ? "text-blue-100" : "text-muted-foreground"}
                                                `}
                                            >
                                                {format(getPhilippineTime(message.timestamp), "h:mm a")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </ScrollArea>
    );
}