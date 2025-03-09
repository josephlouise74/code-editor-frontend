import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { nanoid } from "nanoid";

interface Message {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    system?: boolean;
    isSelf?: boolean;
}

interface ChatMessagesProps {
    messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <ScrollArea className="flex-grow p-4">
            {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start a conversation!
                </div>
            ) : (
                messages.map((message) => (
                    <div key={message.id} className={`mb-4 ${message.system ? "text-center" : ""}`}>
                        {message.system ? (
                            <div className="bg-muted/50 rounded-md py-2 px-3 text-xs text-muted-foreground">
                                {message.content}
                            </div>
                        ) : (
                            <div className={`flex ${message.isSelf ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[80%] ${message.isSelf ? "bg-primary text-primary-foreground" : "bg-muted"
                                        } rounded-lg px-3 py-2`}
                                >
                                    {!message.isSelf && (
                                        <div className="text-xs font-medium mb-1">{message.sender}</div>
                                    )}
                                    <div className="break-words">{message.content}</div>
                                    <div className="text-xs opacity-70 text-right mt-1">
                                        {new Date(message.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </ScrollArea>
    );
}