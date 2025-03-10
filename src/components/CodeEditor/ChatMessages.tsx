import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";

interface Message {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    system?: boolean;
    senderEmail?: string;
}

interface ChatMessagesProps {
    messages: Message[];
    userData: {
        email: string;
        name?: string;
        avatar?: string;
    };
}

export function ChatMessages({ messages, userData }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();

    // Get the participant information from URL params
    const participantRole = searchParams.get("participantRole");
    const participantEmail = searchParams.get("participantEmail");

    // Determine which email to use for identifying self messages
    const selfEmail = participantRole === "participant" && participantEmail
        ? participantEmail
        : userData?.email || "";

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Group consecutive messages from the same sender
    const groupedMessages = messages.reduce<{
        messages: Message[];
        lastSender: string | null;
        groups: Message[][];
    }>(
        (acc, message) => {
            if (message.system) {
                // System messages break the grouping
                if (acc.messages.length > 0) {
                    acc.groups.push([...acc.messages]);
                    acc.messages = [];
                }
                acc.groups.push([message]);
                acc.lastSender = null;
            } else if (acc.lastSender === message.sender) {
                // Group with previous messages from same sender
                acc.messages.push(message);
            } else {
                // New sender, start a new group
                if (acc.messages.length > 0) {
                    acc.groups.push([...acc.messages]);
                }
                acc.messages = [message];
                acc.lastSender = message.sender;
            }
            return acc;
        },
        { messages: [], lastSender: null, groups: [] }
    );

    // Add the last group if it exists
    if (groupedMessages.messages.length > 0) {
        groupedMessages.groups.push(groupedMessages.messages);
    }

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
                groupedMessages.groups.map((group, groupIndex) => {
                    const firstMessage = group[0];

                    if (firstMessage.system) {
                        return (
                            <div key={`group-${groupIndex}`} className="flex justify-center my-6">
                                <div className="bg-muted/50 rounded-md py-2 px-4 text-xs text-muted-foreground max-w-[80%]">
                                    {firstMessage.content}
                                </div>
                            </div>
                        );
                    }

                    const isSelf = firstMessage.senderEmail === selfEmail;

                    return (
                        <div
                            key={`group-${groupIndex}`}
                            className={`mb-6 flex ${isSelf ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[80%] ${isSelf ? "items-end" : "items-start"} flex flex-col`}>
                                {!isSelf && (
                                    <div className="flex items-center mb-1 ml-1">
                                        <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs mr-2">
                                            {firstMessage.sender.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-medium">{firstMessage.sender}</span>
                                    </div>
                                )}

                                <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"} gap-1`}>
                                    {group.map((message, messageIndex) => (
                                        <div
                                            key={message.id}
                                            className={`
                                                relative px-4 py-2 
                                                ${isSelf
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-muted/60"
                                                }
                                                ${messageIndex === 0
                                                    ? (isSelf ? "rounded-tl-lg rounded-tr-lg rounded-bl-lg" : "rounded-tl-lg rounded-tr-lg rounded-br-lg")
                                                    : ""
                                                }
                                                ${messageIndex === group.length - 1
                                                    ? (isSelf ? "rounded-tl-lg rounded-bl-lg rounded-br-lg" : "rounded-bl-lg rounded-br-lg rounded-tr-lg")
                                                    : ""
                                                }
                                                ${group.length === 1 ? "rounded-lg" : ""}
                                                ${isSelf ? "hover:bg-primary/90" : "hover:bg-muted"}
                                                transition-colors duration-200
                                            `}
                                        >
                                            <div className="break-words">{message.content}</div>
                                            {messageIndex === group.length - 1 && (
                                                <div className={`
                                                    text-xs mt-1
                                                    ${isSelf
                                                        ? "text-primary-foreground/70"
                                                        : "text-muted-foreground"
                                                    }
                                                `}>
                                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </ScrollArea>
    );
}