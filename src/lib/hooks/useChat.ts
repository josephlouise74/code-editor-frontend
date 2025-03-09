/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} name - Username
 * @property {boolean} online - Online status
 */

/**
 * @typedef {Object} Message
 * @property {string} id - Message ID
 * @property {string} sender - Sender name
 * @property {string} content - Message content
 * @property {string} timestamp - Message timestamp
 * @property {boolean} [isSelf] - Whether the message is from the current user
 * @property {boolean} [system] - Whether it's a system message
 */

/**
 * Hook to manage chat functionality
 * @param {Object} options - Hook options
 * @param {string} options.roomId - Current room ID
 * @param {Object} options.socket - Socket.io connection
 * @param {boolean} options.isConnected - Connection status
 * @returns {Object} Chat state and methods
 */
import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";

export function useChat({ roomId, socket, isConnected }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState<any>("");
    const [username, setUsername] = useState<any>(`User-${nanoid(4)}`);
    const [users, setUsers] = useState<any[]>([
        { id: "1", name: "You", online: true },
        { id: "2", name: "Guest123", online: true },
        { id: "3", name: "Coder42", online: false },
    ]);
    const [copied, setCopied] = useState<any>(false);
    const [sidebarOpen, setSidebarOpen] = useState<any>(false);

    const messagesEndRef = useRef<any>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const addSystemMessage = (content: any): any => {
        setMessages((prev: any) => [
            ...prev,
            {
                id: nanoid(),
                sender: "System",
                content,
                timestamp: new Date().toISOString(),
                system: true,
            },
        ]);
    };

    const sendMessage = (): any => {
        if (!messageInput.trim()) return;

        const newMessage: any = {
            id: nanoid(),
            sender: username,
            content: messageInput,
            timestamp: new Date().toISOString(),
            isSelf: true,
        };

        setMessages((prev: any) => [...prev, newMessage]);
        setMessageInput("");

        if (isConnected && socket) {
            socket.emit("chat-message", {
                room: roomId,
                message: { ...newMessage, isSelf: false },
            });
        }
    };

    const handleShareRoom = (): any => {
        const shareUrl = window.location.href;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return {
        messages,
        messageInput,
        username,
        users,
        copied,
        sidebarOpen,
        messagesEndRef,
        setMessages,
        setMessageInput,
        setUsername,
        setUsers,
        setCopied,
        setSidebarOpen,
        addSystemMessage,
        sendMessage,
        handleShareRoom,
    };
}