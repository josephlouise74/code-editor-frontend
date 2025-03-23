"use client";

import { ChatMessages } from "@/components/CodeEditor/ChatMessages";
import { HistoryTracker } from "@/components/CodeEditor/HistoryTracker";
import { ParticipantForm } from "@/components/CodeEditor/ParticipantForm";
import PreviewPanel from "@/components/CodeEditor/PreviewPanel";
import ToolBar from "@/components/CodeEditor/Toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAllChats, getAllHistoryCode, getRoomData, sendNewMessageInGroupChatApiRequest, updateSaveChangesCodeApi } from "@/lib/api/roomApi";
import { roomStore } from "@/lib/store/roomStore";
import { uploadVoiceMessage } from "@/lib/supabase/supabase";
import { css as cssLang } from "@codemirror/lang-css";
import { html as htmlLang } from "@codemirror/lang-html";
import { javascript as jsLang } from "@codemirror/lang-javascript";
import {
    Loader2,
    MessageSquare,
    Mic,
    Square,
    Terminal,
    Trash,
    Users,
    X
} from "lucide-react";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";



interface ConsoleLog {
    id: string;
    type: 'log' | 'error' | 'warn' | 'info';
    content: string;
    timestamp: string;
}

// Mock socket functions (replace with your actual implementation)
// Update socket type
const mockSocket: {
    id?: string;
    connected?: boolean;
    emit: (event: string, data: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
    disconnect: () => void;
} = {
    emit: (event, data) => console.log(`Socket emitted: ${event}`, data),
    on: (event, callback) => { },
    off: (event, callback) => { },
    disconnect: () => console.log('Socket disconnected'),
};

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });


// Add WebSocket types
interface WebSocketMessage {
    type: 'init' | 'codeUpdate' | 'cursorUpdate';
    data: {
        code?: string;
        language?: string;
        roomId: string;
        userId: string;
        cursorPosition?: number;
        html?: string;
        css?: string;
        javascript?: string;
    };
}


// Loading component for better UX
const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h2 className="text-2xl font-semibold mb-3">Loading Code Editor</h2>
        <p className="text-muted-foreground text-center max-w-md">
            Setting up your collaborative workspace. This may take a moment...
        </p>
    </div>
);


export default function HomeScreen() {
    // State variables with type annotations
    const [htmlCode, setHtmlCode] = useState<any>("");
    const [cssCode, setCssCode] = useState<any>(
        ""
    );
    const [jsCode, setJsCode] = useState<any>(
        ""
    );
    // Add loading state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([]);

    const [showChatSidebar, setShowChatSidebar] = useState<boolean>(false);
    const [srcDoc, setSrcDoc] = useState<any>("");
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [roomId, setRoomId] = useState<string>("");
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
    const [messageInput, setMessageInput] = useState<string>("");
    const [layout, setLayout] = useState<"split" | "editor" | "preview">("split");
    const [showConsole, setShowConsole] = useState<boolean>(true);
    // Add this with other state declarationsco
    const [isMessageSending, setIsMessageSending] = useState<boolean>(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const socket = useRef<typeof mockSocket | null>(mockSocket);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    // Get roomId and token from URL parameters
    const params = useParams();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [isSaving, setIsSaving] = useState(false);

    const [userData, setUserData] = useState<any>(null)

    const [isRecording, setIsRecording] = useState(false);

    const [recordingDuration, setRecordingDuration] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const audioChunks = useRef<Blob[]>([]);
    const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isVoiceLoading, setIsVoiceLoading] = useState(false);


    // Update your state declarations
    const [codeHistory, setCodeHistory] = useState<any>({
        roomId: '',
        history: [],
        pagination: {
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
            totalItems: 0,
            itemsPerPage: 10
        },
        meta: {
            timestamp: '',
            query: {
                page: 1,
                limit: 10,
                sortBy: 'timestamp'
            }
        }
    });
    const [showHistory, setShowHistory] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);

    const isParticipant = searchParams.get('participant') === 'true';
    const hostName = searchParams.get('host');
    // Helper: Get CSS class for console log based on type
    function getConsoleLogClass(type: string): string {
        switch (type) {
            case "error":
                return "text-red-400";
            case "warn":
                return "text-yellow-400";
            case "info":
                return "text-blue-400";
            default:
                return "text-green-400";
        }
    }
    const handleRestoreVersion = (version: any) => {
        const { html, css, javascript } = version.codeContent;
        setHtmlCode(html);
        setCssCode(css);
        setJsCode(javascript);
        toast.success('Code version restored successfully');
    };

    // Optimized history fetching
    const fetchHistory = useCallback(async (page = 1, limit = 10) => {
        try {
            if (!roomId) {
                console.warn('Room ID is not available');
                return;
            }

            const historyCodeResponse = await getAllHistoryCode(roomId, page, limit);
            if (historyCodeResponse?.success && historyCodeResponse?.data?.history) {
                setCodeHistory(historyCodeResponse.data);
            } else {
                console.warn('No history data available');
            }
        } catch (error) {
            console.error('Error fetching code history:', error);
            toast.error('Failed to load code history');
        }
    }, [roomId]);

    const handlePreviewVersion = (version: any) => {
        const { html, css, javascript } = version.codeContent;
        const previewDoc = `
            <html>
                <head><style>${css}</style></head>
                <body>${html}<script>${javascript}</script></body>
            </html>
        `;
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(previewDoc);
            previewWindow.document.close();
        }
    };

    const handlePageChange = (page: number) => {
        fetchHistory(page, codeHistory.pagination.itemsPerPage);
    };

    const handleLimitChange = (limit: number) => {
        fetchHistory(1, limit);
    };

    // Optimized room data fetching
    const getRoomDataFetch = useCallback(async (roomId: string, token: string) => {
        try {
            const prepareData = { roomId, token };
            const response = await getRoomData(prepareData);

            if (!response?.success || !response?.data) {
                throw new Error('Invalid room data received');
            }

            const { codeContent, participants, roomName, accessCode } = response.data;

            if (codeContent) {
                const { html, css, javascript } = codeContent;
                setHtmlCode(html || '');
                setCssCode(css || '');
                setJsCode(javascript || '');
            }

            if (participants) {
                const participantUsers = participants.map((participant: any) => ({
                    id: participant.id || nanoid(),
                    name: participant.name || participant.email,
                    email: participant.email,
                    online: true
                }));
                setUsers(participantUsers);
                setUserData(response.data);
            }

            // Update room store
            roomStore.setCurrentRoom({
                roomId,
                roomName,
                accessCode,
                role: 'participant',
                token,
                codeContent: codeContent || { html: '', css: '', javascript: '' }
            });

            return true;
        } catch (error) {
            toast.error('Failed to fetch room data. Please try again.');
            console.error('Error fetching room data:', error);
            return false;
        }
    }, []);

    // Add this function to handle new messages
    const generateMessageId = (): string => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `${timestamp}_${random}`;
    };

    const handleNewMessage = useCallback((message: any) => {
        if (!showChatSidebar) {
            toast.info(`New message from ${message.userName}`);
        }
    }, [showChatSidebar]);


    // Add WebSocket connection effect
    useEffect(() => {
        const currentRoomId = params.roomId as string;
        if (!currentRoomId || !token) return;

        // Create WebSocket connection
        const ws = new WebSocket('ws://localhost:7400');
        wsRef.current = ws;

        // Connection opened
        ws.addEventListener('open', () => {
            console.log('WebSocket connection established');
            setWsConnected(true);

            // Send initialization message
            const userId = userData?.id || socket.current?.id || `user-${nanoid()}`;
            const initMessage: WebSocketMessage = {
                type: 'init',
                data: {
                    roomId: currentRoomId,
                    userId
                }
            };
            ws.send(JSON.stringify(initMessage));

            toast.success('Connected to code sync server');
        });

        // Listen for messages
        ws.addEventListener('message', (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);

                switch (message.type) {
                    case 'init':
                        // Handle initial code state if needed
                        if (message.data.html) setHtmlCode(message.data.html);
                        if (message.data.css) setCssCode(message.data.css);
                        if (message.data.javascript) setJsCode(message.data.javascript);
                        break;

                    case 'codeUpdate':
                        // Update code based on language
                        if (message.data.language === 'html' && message.data.code) {
                            setHtmlCode(message.data.code);
                        } else if (message.data.language === 'css' && message.data.code) {
                            setCssCode(message.data.code);
                        } else if (message.data.language === 'javascript' && message.data.code) {
                            setJsCode(message.data.code);
                        }
                        break;

                    case 'cursorUpdate':
                        // Handle cursor updates if needed
                        // This would require additional UI elements to show other users' cursors
                        break;
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });

        // Connection closed
        ws.addEventListener('close', () => {
            console.log('WebSocket connection closed');
            setWsConnected(false);
            toast.warning('Disconnected from code sync server');
        });

        // Connection error
        ws.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            toast.error('Error connecting to code sync server');
        });

        // Clean up on unmount
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [params.roomId, token, userData?.id]);



    useEffect(() => {
        const currentRoomId = params.roomId as string;
        if (!currentRoomId || !token) return;

        console.log('🔄 Initializing connection for room:', currentRoomId);

        try {
            // Initialize socket with proper configuration
            socket.current = io("http://localhost:7400", {
                transports: ['polling', 'websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000
            });

            socket.current.on("connect", () => {
                console.log('✅ Socket connected:', socket.current?.id);
                setIsConnected(true);

                // Get role from localStorage
                const userRole = localStorage.getItem('role');
                let userName, userEmail;

                if (userRole === 'host') {
                    // Get admin data
                    userName = localStorage.getItem('adminName') || 'Admin';
                    userEmail = localStorage.getItem('adminEmail') || '';
                    console.log('🔑 Connected as host:', { userName, userEmail });
                } else {
                    // Get participant data
                    userName = localStorage.getItem('participantName') || 'Anonymous';
                    userEmail = localStorage.getItem('participantEmail') || '';
                    console.log('👤 Connected as participant:', { userName, userEmail });
                }

                // Join chat room with correct event name and data structure
                socket.current?.emit("join-chat", {
                    roomId: currentRoomId,
                    name: userName,
                    email: userEmail,
                    role: userRole || 'participant'
                });
            });

            // Set up event listeners
            setupSocketEventListeners();

            return () => {
                console.log('🧹 Cleaning up socket connection...');
                if (socket.current) {
                    socket.current.disconnect();
                    socket.current = null;
                }
            };
        } catch (error) {
            console.error('❌ Socket connection error:', error);
            toast.error('Failed to connect to chat server');
        }
    }, [params.roomId, token, userData?.id]);

    // Add the setupSocketEventListeners function
    const setupSocketEventListeners = () => {
        if (!socket.current) return;

        // Chat history
        socket.current.on("chat-history", (messages: ChatMessage[]) => {
            console.log('📚 Received chat history:', messages);
            const processedMessages = messages.map(message => ({
                ...message,
                isSelf: message.userId === socket.current?.id
            }));
            setMessages(processedMessages);
        });

        // New message
        socket.current.on("chat-message", (message: ChatMessage) => {
            console.log('📨 New message received:', message);
            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                const newMessage = {
                    ...message,
                    isSelf: message.userId === socket.current?.id
                };
                return [...prev, newMessage];
            });
        });

        // User presence
        socket.current.on("user-joined", (user: any) => {
            console.log('👋 User joined:', user);
            setUsers(prev => [...prev, { ...user, online: true }]);
            addSystemMessage(`${user.name} joined the room`);
        });

        socket.current.on("user-left", (userId: string) => {
            const user = users.find(u => u.id === userId);
            if (user) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, online: false } : u
                ));
                addSystemMessage(`${user.name} left the room`);
            }
        });

        socket.current.on("room-users", (users: any[]) => {
            console.log('👥 Room users updated:', users);
            setUsers(users.map(user => ({ ...user, online: true })));
        });

        // Typing indicators
        socket.current.on("user-typing", ({ userId, name, isTyping }) => {
            setTypingUsers(prev => {
                if (isTyping) {
                    return [...prev.filter(u => u.id !== userId), { id: userId, name }];
                }
                return prev.filter(u => u.id !== userId);
            });
        });

        // Error handling
        socket.current.on("connect_error", (error) => {
            console.error('❌ Connection error:', error);
            toast.error(`Connection failed: ${error.message}`);
        });

        socket.current.on("error", (error) => {
            console.error('❌ Socket error:', error);
            toast.error(error.message);
        });

        socket.current.on("disconnect", () => {
            console.log('🔌 Disconnected from server');
            setIsConnected(false);
            toast.warning("Disconnected from chat server. Attempting to reconnect...");
        });
    };




    const handleVoiceRecording = async () => {
        try {
            if (isRecording) {
                stopRecording();
            } else {
                await startRecording();

            }
        } catch (error) {
            console.error('Error handling voice recording:', error);
            toast.error('Failed to access microphone. Please check permissions.');
            setIsRecording(false);
            setRecordingDuration(0);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        setIsRecording(false);
    };

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });

        const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
            bitsPerSecond: 128000
        });

        audioChunks.current = [];
        recorder.ondataavailable = handleDataAvailable;
        recorder.onstop = () => handleRecordingStop(stream);

        setMediaRecorder(recorder);
        recorder.start(1000);
        setIsRecording(true);
        setRecordingDuration(0); // Reset duration when starting
    };

    const setupRecorderEventHandlers = (recorder: MediaRecorder, stream: MediaStream) => {
        recorder.ondataavailable = handleDataAvailable;
        recorder.onstop = () => handleRecordingStop(stream);
    };

    const handleDataAvailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
            audioChunks.current.push(event.data);
            console.log('Recording chunk received:', event.data.size, 'bytes');
        }
    };

    const handleRecordingStop = async (stream: MediaStream) => {
        try {
            setIsVoiceLoading(true);

            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            console.log('Voice recording completed', {
                size: audioBlob.size,
                chunks: audioChunks.current.length,
                duration: recordingDuration
            });

            const result = await uploadVoiceMessage({
                file: audioBlob,
                folder: `rooms/${roomId}/voice-messages`
            });

            if (result.error || !result.url) {
                throw new Error(result.error || 'Failed to upload voice message');
            }

            await sendVoiceMessage(result);

        } catch (error) {
            console.error('Error processing voice message:', error);
            toast.error('Failed to send voice message. Please try again.');
        } finally {
            cleanup(stream);
            setIsVoiceLoading(false);
        }
    };

    const sendVoiceMessage = async (uploadResult: any) => {
        const userRole = localStorage.getItem('role');
        const messageData = {
            roomId: roomId,
            name: userData?.name || '',
            email: userRole === 'host'
                ? localStorage.getItem('adminEmail')
                : localStorage.getItem('participantEmail'),
            content: uploadResult.url,
            type: 'voice',
            duration: recordingDuration,
            filePath: uploadResult.filePath,
            role: userRole || 'participant'
        };

        console.log('Sending voice message data:', messageData);

        try {
            // First, emit to socket for real-time update
            socket.current?.emit('send-message', messageData);

            // Then, store in database
            const response = await sendNewMessageInGroupChatApiRequest(messageData);

            if (!response.success) {
                throw new Error('Failed to store voice message');
            }

            // No need to manually update messages, it will come through socket
            console.log('Voice message sent successfully');
        } catch (error) {
            console.error('Error sending voice message:', error);
            throw new Error('Failed to send voice message');
        }
    };
    const cleanup = (stream: MediaStream) => {
        stream.getTracks().forEach(track => track.stop());
        setIsLoading(false);
        setRecordingDuration(0);
        audioChunks.current = [];
    };

    // Add this useEffect to handle the recording timer
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRecording) {
            const startTime = Date.now();
            interval = setInterval(() => {
                const duration = Math.floor((Date.now() - startTime) / 1000);
                setRecordingDuration(duration);

                // Automatically stop recording after 60 seconds
                if (duration >= 60) {
                    handleVoiceRecording();
                }
            }, 1000);
        } else {
            setRecordingDuration(0);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRecording]);




    // Update the sendMessage function
    const sendMessage = async () => {
        if (!messageInput.trim() || isMessageSending || !socket.current?.connected) return;

        try {
            setIsMessageSending(true);

            const participantRole = searchParams.get('participantRole');
            let messageData;

            if (participantRole === 'participant') {
                messageData = {
                    roomId,
                    name: searchParams.get('participantName') || 'Anonymous',
                    email: searchParams.get('participantEmail') || '',
                    message: messageInput.trim(),
                    role: 'participant',
                    token: token // Add token for API auth
                };
            } else {
                messageData = {
                    roomId,
                    name: 'Host',
                    email: searchParams.get('adminEmail') || '',
                    message: messageInput.trim(),
                    role: 'host',
                    token: token // Add token for API auth
                };
            }

            // Send via socket
            socket.current.emit("send-message", messageData);

            // Send via API and log response
            const apiResponse = await sendNewMessageInGroupChatApiRequest(messageData);

            console.log('Message API Response:', apiResponse);

            setMessageInput("");

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsMessageSending(false);
        }
    };

    // Update the typing indicator function
    const handleTyping = (isTyping: boolean) => {
        if (socket.current?.connected) {
            socket.current.emit("typing", {
                roomId,
                name: searchParams.get('participantName') || userData?.name || 'Anonymous',
                isTyping
            });
        }
    };

    // Add a helper function for system messages
    const addSystemMessage = (content: string) => {
        const systemMessage: ChatMessage = {
            id: generateMessageId(),
            content,
            userId: 'system',
            userName: 'System',
            userEmail: 'system@example.com',
            timestamp: Date.now(),
            system: true
        };
        setMessages(prev => [...prev, systemMessage]);
    };

    // First, add this interface for type safety
    interface ChatResponse {
        success: boolean;
        message: string;
        data: {
            roomId: string;
            chats: Array<{
                uid: string;
                userName: string;
                email: string;
                role: 'host' | 'participant';
                timestamp: string;
                type: 'text' | 'voice';
                message: string;
            }>;
            totalMessages: number;
            lastUpdated: string;
        };
    }

    // Then modify the useEffect
    useEffect(() => {
        const currentRoomId = params.roomId as string;
        const currentToken = searchParams.get('token');
        const host = searchParams.get('host');
        console.log("host", host)
        if (!currentRoomId || !currentToken) {
            toast.error('Missing room ID or token');
            return;
        }

        const initializeRoom = async () => {
            try {
                setIsLoading(true);
                setRoomId(currentRoomId);

                // Fetch room data first
                const roomDataSuccess = await getRoomDataFetch(currentRoomId, currentToken);
                console.log("roomdata", roomDataSuccess)
                if (!roomDataSuccess) return;

                // Fetch chat messages
                try {
                    const chatResponse = await getAllChats(currentRoomId);
                    console.log('Chat Response:', chatResponse);

                    if (chatResponse?.success && chatResponse?.data?.chats) {
                        const formattedChats = chatResponse.data.chats.map((chat: any) => ({
                            uid: chat.uid,
                            userId: chat.uid,
                            userName: chat.userName,
                            content: chat.message,
                            timestamp: new Date(chat.timestamp).getTime(),
                            email: chat.email,
                            isSelf: chat.email === userData?.email,
                            type: chat.type,
                            role: chat.role
                        }));

                        setMessages(formattedChats);
                        console.log(`Loaded ${chatResponse.data.totalMessages} messages, last updated: ${chatResponse.data.lastUpdated}`);
                    }
                } catch (error) {
                    console.error('Error loading chat messages:', error);
                    toast.warning('Failed to load chat history');
                }

                // Connect to room and fetch other data
                connectToRoom(currentRoomId);
                fetchHistory();

                // Fetch history code
                try {
                    const historyCodeResponse = await getAllHistoryCode(currentRoomId);
                    console.log("hostName", hostName);
                    console.log("hs", historyCodeResponse.data.history);

                    if (historyCodeResponse?.success && historyCodeResponse?.data?.history) {
                        setCodeHistory(historyCodeResponse.data.history);
                    } else {
                        console.warn('No history data available');
                    }
                } catch (error) {
                    console.error('Error fetching code history:', error);
                    toast.error('Failed to load code history');
                }

            } catch (error) {
                console.error('Error initializing room:', error);
                toast.error('Failed to initialize room');
            } finally {
                setIsLoading(false);
            }
        };

        initializeRoom();

        // Cleanup function
        return () => {
            setMessages([]);
            setUsers([]);
            setUserData(null);
        };
    }, [params.roomId, searchParams,]); // Added userData?.email as dependency



    // First, add the ChatMessage interface
    interface ChatMessage {
        id: string;
        content: string;
        userId: string;
        userName: string;
        userEmail: string;
        userRole?: string;
        timestamp: number;
        system?: boolean;
    }

    // Update the connectToRoom function
    const connectToRoom = (roomId: string): void => {
        console.log(`🔄 Attempting to connect to room: ${roomId}`);

        if (socket.current?.connected) {
            console.log('⚠️ Socket already connected, skipping initialization');
            return;
        }

        try {
            // Initialize socket connection with proper configuration
            socket.current = io("http://localhost:7400", {
                transports: ['polling', 'websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000
            });

            socket.current.on("connect", () => {
                console.log('✅ Socket connected:', socket.current?.id);
                setIsConnected(true);

                // Get role from localStorage
                const userRole = localStorage.getItem('role');
                let userName, userEmail;

                if (userRole === 'host') {
                    // Get admin data
                    userName = localStorage.getItem('adminName') || 'Admin';
                    userEmail = localStorage.getItem('adminEmail') || '';
                    console.log('🔑 Connected as host:', { userName, userEmail });
                } else {
                    // Get participant data
                    userName = localStorage.getItem('participantName') || 'Anonymous';
                    userEmail = localStorage.getItem('participantEmail') || '';
                    console.log('👤 Connected as participant:', { userName, userEmail });
                }

                // Join chat room with correct event name and data structure
                socket.current?.emit("join-chat", {
                    roomId,
                    name: userName,
                    email: userEmail,
                    role: userRole || 'participant'
                });
            });

            // Chat event listeners matching backend events
            socket.current.on("chat-history", (messages: ChatMessage[]) => {
                console.log('📚 Received chat history:', messages.length);
                const processedMessages = messages.map(message => ({
                    ...message,
                    isSelf: message.userId === socket.current?.id
                }));
                setMessages(processedMessages);
            });

            socket.current.on("chat-message", (message: ChatMessage) => {
                console.log('📨 New message:', message);
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, { ...message, isSelf: message.userId === socket.current?.id }];
                });
            });

            socket.current.on("user-typing", ({ userId, name, isTyping }) => {
                setTypingUsers(prev => {
                    if (isTyping) {
                        return [...prev, { id: userId, name }];
                    }
                    return prev.filter(user => user.id !== userId);
                });
            });

            socket.current.on("room-users", (users: any[]) => {
                console.log('👥 Room users:', users);
                setUsers(users.map(user => ({ ...user, online: true })));
            });

            socket.current.on("join-success", (response) => {
                console.log('✅ Join success:', response);
                toast.success(`Joined room ${response.roomId}`);
            });

            socket.current.on("error", (error) => {
                console.error('❌ Socket error:', error);
                toast.error(error.message);
            });

            socket.current.on("disconnect", () => {
                console.log('🔌 Disconnected from server');
                setIsConnected(false);
                toast.warning("Disconnected from chat server");
            });

        } catch (error) {
            console.error('❌ Error connecting to room:', error);
            toast.error('Failed to connect to chat server');
        }
    };



    // Add this function to handle console interception
    // Memoized console interceptor
    const createConsoleInterceptor = useCallback(() => `
  <script>
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    function interceptConsole(type) {
      return function(...args) {
        originalConsole[type].apply(console, args);
        const content = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        window.parent.postMessage({
          type: 'console',
          logType: type,
          content: content
        }, '*');
      };
    }

    console.log = interceptConsole('log');
    console.error = interceptConsole('error');
    console.warn = interceptConsole('warn');
    console.info = interceptConsole('info');
  </script>
`, []);

    // Update the runCode function
    const runCode = () => {
        // Clear previous console logs when running new code
        setConsoleLogs([]);

        const source = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Live Preview</title>
                    ${createConsoleInterceptor()}
                    <style>${cssCode}</style>
                </head>
                <body>
                    ${htmlCode}
                    <script>
                        try {
                            ${jsCode}
                        } catch (error) {
                            console.error(error.message);
                        }
                    </script>
                </body>
            </html>
        `;

        if (iframeRef.current) {
            const iframe = iframeRef.current;
            iframe.srcdoc = source;
        }
    };

    // Update the useEffect for console message handling
    useEffect(() => {
        const handleConsoleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === "console") {
                setConsoleLogs((prev) => [
                    ...prev,
                    {
                        id: nanoid(),
                        type: event.data.logType,
                        content: event.data.content,
                        timestamp: new Date().toISOString(),
                    },
                ]);
            }
        };

        window.addEventListener("message", handleConsoleMessage);
        return () => window.removeEventListener("message", handleConsoleMessage);
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Generate or get room ID from URL and connect
    useEffect(() => {
        const id = params.roomId as string;
        if (id) {
            setRoomId(id);

            connectToRoom(id);
        }

        return () => {
            // Clean up socket connection
            if (socket.current) {
                socket.current.off("code-update", () => { });
                socket.current.off("chat-message", () => { });
                socket.current.off("user-joined", () => { });
            }
        };
    }, [params.roomId]);



    // Update the live preview with a debounce and console intercept script
    useEffect(() => {
        const timeout = setTimeout(() => {
            const source = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Live Preview</title>
                    
                    <!-- Console Interceptor -->
                    <script>
                        // Set up console interceptor before any user code runs
                        const originalConsole = console;
                        console = {
                            log: function() {
                                originalConsole.log.apply(originalConsole, arguments);
                                window.parent.postMessage({
                                    type: 'console',
                                    logType: 'log',
                                    content: Array.from(arguments).map(arg => 
                                        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                    ).join(' ')
                                }, '*');
                            },
                            error: function() {
                                originalConsole.error.apply(originalConsole, arguments);
                                window.parent.postMessage({
                                    type: 'console',
                                    logType: 'error',
                                    content: Array.from(arguments).map(arg => 
                                        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                    ).join(' ')
                                }, '*');
                            },
                            warn: function() {
                                originalConsole.warn.apply(originalConsole, arguments);
                                window.parent.postMessage({
                                    type: 'console',
                                    logType: 'warn',
                                    content: Array.from(arguments).map(arg => 
                                        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                    ).join(' ')
                                }, '*');
                            },
                            info: function() {
                                originalConsole.info.apply(originalConsole, arguments);
                                window.parent.postMessage({
                                    type: 'console',
                                    logType: 'info',
                                    content: Array.from(arguments).map(arg => 
                                        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                    ).join(' ')
                                }, '*');
                            }
                        };

                        // Global error handler
                        window.onerror = function(msg, url, line, col, error) {
                            console.error(\`\${msg} (at line \${line}:\${col})\`);
                            return false;
                        };
                        
                        // localStorage polyfill
                        try {
                            window.localStorage.getItem('test');
                        } catch (e) {
                            console.info('localStorage not available, using polyfill');
                            const createStoragePolyfill = () => {
                                const storage = {};
                                return {
                                    getItem: (key) => storage[key] || null,
                                    setItem: (key, value) => { storage[key] = value.toString(); },
                                    removeItem: (key) => { delete storage[key]; },
                                    clear: () => { Object.keys(storage).forEach(key => { delete storage[key]; }) },
                                    key: (index) => Object.keys(storage)[index] || null,
                                    length: Object.keys(storage).length
                                };
                            };
                            window.localStorage = createStoragePolyfill();
                            window.sessionStorage = createStoragePolyfill();
                        }
                    </script>
                    
                    <style>${cssCode}</style>
                </head>
                <body>
                    ${htmlCode}
                    
                    <script>
                        // Wait for DOM to be fully loaded before executing user code
                        document.addEventListener('DOMContentLoaded', function() {
                            try {
                                // Execute user's JavaScript with proper error handling
                                (function() {
                                    ${jsCode}
                                })();
                            } catch (error) {
                                console.error('Script execution error:', error.message);
                            }
                        });
                        
                        // Also execute immediately for code that doesn't need DOM ready
                        try {
                            (function() {
                                ${jsCode}
                            })();
                        } catch (error) {
                            // Silent catch for immediate execution
                        }
                    </script>
                </body>
            </html>
        `;
            setSrcDoc(source);
        }, 250);

        return () => clearTimeout(timeout);
    }, [htmlCode, cssCode, jsCode]);



    // Update the saveAndRunCode function
    const saveAndRunCode = () => {
        setConsoleLogs([]);
        runCode();
    };

    // Share the room URL for collaborative editing
    const handleShareRoom = async () => {
        const shareUrl = window.location.href;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy share URL:', error);
        }
    };



    const getAllDataChats = useCallback(async (roomId: string) => {
        try {
            const response = await getAllChats(roomId);

            if (!response?.success || !response?.data?.chats) {
                throw new Error('Invalid chat data received');
            }

            const formattedChats = response.data.chats.map((chat: any) => ({
                uid: chat.uid,
                userId: chat.uid, // Using uid as userId for consistency
                userName: chat.userName,
                content: chat.message,
                timestamp: new Date(chat.timestamp).getTime(),
                email: chat.email,
                isSelf: chat.email === userData?.email,
                type: chat.type,
                role: chat.role
            }));

            setMessages(formattedChats);

            // Optionally store total messages and last updated time
            const { totalMessages, lastUpdated } = response.data;
            console.log(`Loaded ${totalMessages} messages, last updated: ${lastUpdated}`);

            return true;
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            toast.error('Failed to load chat messages');
            return false;
        }
    }, [userData?.email]);

    // Optimized code change handler
    const handleCodeChange = useCallback((type: 'html' | 'css' | 'js', value: string) => {
        if (type === "html") {
            setHtmlCode(value);
        } else if (type === "css") {
            setCssCode(value);
        } else if (type === "js") {
            setJsCode(value);
        }

        // Emit changes via sockets
        if (isConnected && socket.current) {
            socket.current.emit("code-update", {
                room: roomId,
                type,
                content: value,
            });
        }

        if (wsConnected && wsRef.current?.readyState === WebSocket.OPEN) {
            const userId = userData?.id || socket.current?.id || `user-${nanoid()}`;
            const language = type === 'html' ? 'html' : type === 'css' ? 'css' : 'javascript';

            const updateMessage: WebSocketMessage = {
                type: 'codeUpdate',
                data: {
                    code: value,
                    language,
                    roomId,
                    userId
                }
            };

            wsRef.current.send(JSON.stringify(updateMessage));
        }
    }, [isConnected, roomId, userData?.id, wsConnected]);


    // Update the chat form JSX
    const renderChatForm = () => (
        <div className="p-4 border-t-2 bg-white relative z-40">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                }}
                className="flex space-x-2"
            >
                <Input
                    value={messageInput}
                    onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping(true);
                    }}
                    onBlur={() => handleTyping(false)}
                    placeholder="Type a message..."
                    className="flex-grow"
                    disabled={!isConnected || isMessageSending || isRecording}
                />

                {!isRecording ? (
                    <>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!isConnected || isMessageSending || !messageInput.trim()}
                            className="border"
                        >
                            {isMessageSending ? "Sending..." : "Send"}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={handleVoiceRecording}
                            disabled={isVoiceLoading}
                        >
                            {isVoiceLoading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                                <Mic className="h-4 w-4" />
                            )}
                        </Button>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-xs font-medium text-red-600 dark:text-red-400 min-w-[2rem]">
                                    {recordingDuration}s
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleVoiceRecording}
                            className="h-9 w-9 bg-red-500 hover:bg-red-600 text-white"
                        >
                            <Square className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );

    // Update the TabsContent to use the new form
    <TabsContent value="chat" className="flex-grow flex flex-col p-0 m-0 h-screen">
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
            <div className="flex flex-col h-full">
                <ChatMessages
                    messages={messages}
                    userData={userData}
                    roomId={roomId}
                    onNewMessage={handleNewMessage}
                />
            </div>
        </ScrollArea>
        <div className="sticky bottom-0 w-full bg-white">
            {renderChatForm()}
        </div>
    </TabsContent>


    // Clear console logs
    const clearConsole = () => {
        setConsoleLogs([]);
    };

    // Save and run code
    const handleSaveChanges = async () => {
        try {
            setIsSaving(true);
            const roomDetails = roomStore.currentRoomDetails;
            const searchParams = new URLSearchParams(window.location.search);
            const isCollaborator = searchParams.get('collaborator') === 'true';


            const updateData: any = {
                roomId: roomDetails.roomId,
                roomName: roomDetails.roomName,
                accessCode: roomDetails.accessCode,
                role: roomDetails.role,
                codeContent: {
                    html: htmlCode,
                    css: cssCode,
                    javascript: jsCode
                },
                token: roomStore.token,
                collaborator: isCollaborator,
                participantName: isCollaborator
                    ? searchParams.get('participantName')
                    : searchParams.get('host'),
                participantEmail: isCollaborator
                    ? searchParams.get('participantEmail')
                    : searchParams.get('adminEmail'),
                userData: {
                    ...userData,
                },
            };


            console.log("updated", updateData)
            const response = await updateSaveChangesCodeApi(updateData);

            if (response.success) {
                roomStore.setCurrentRoom({
                    ...roomStore.currentRoom!,
                    codeContent: response.data.codeContent,
                });
                toast.success('Changes saved successfully!');
            }

        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error('Failed to save changes. Please try again.');

            if (roomStore.currentRoom?.codeContent) {
                roomStore.setCurrentRoom(roomStore.currentRoom);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const renderChatSidebar = () => {
        return (
            <div className="flex flex-col h-full border-2 bg-white relative z-50">
                <div className="flex justify-between items-center p-3 border-b">
                    <h3 className="font-medium">Chat & Participants</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowChatSidebar(false)}
                        className="h-8 w-8 p-0"
                    >
                        <X size={16} />
                    </Button>
                </div>
                <Tabs defaultValue="chat" className="flex flex-col h-full">
                    <div className="p-4 border-b-2 relative z-40">
                        <TabsList className="w-full border">
                            <TabsTrigger value="chat" className="flex-1 border-r">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Chat
                            </TabsTrigger>
                            <TabsTrigger value="users" className="flex-1">
                                <Users className="w-4 h-4 mr-2" />
                                Users
                            </TabsTrigger>
                        </TabsList>
                    </div>


                    <TabsContent value="chat" className="flex-grow flex flex-col p-0 m-0 h-screen">
                        <ScrollArea className="flex-1 h-[calc(100vh-180px)] ">
                            <div className="flex flex-col h-full">
                                <ChatMessages
                                    messages={messages}
                                    userData={userData}
                                    roomId={roomId}
                                    onNewMessage={handleNewMessage}
                                />
                            </div>
                        </ScrollArea>
                        <div className="sticky bottom-0 w-full bg-white">
                            {renderChatForm()}
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="p-0 m-0 h-full">
                        <ScrollArea className="h-full p-4 border ">
                            <div className="space-y-4">
                                <Separator className="" />
                                {/*   <div>
                                    <h3 className="text-sm font-medium mb-2">Your details</h3>
                                    <div className="flex items-center space-x-2">
                                        <Avatar>
                                            <AvatarFallback>Code</AvatarFallback>
                                        </Avatar>
                                        <Input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Your name"
                                            className="h-8"
                                        />
                                    </div>
                                </div> */}

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-medium mb-2">Room Participants</h3>
                                    <div className="space-y-2">
                                        {users
                                            .filter(user => user.name !== "Host")
                                            .map((user) => (
                                                <div key={user.id} className="flex items-center space-x-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            {user.name?.charAt(0) || 'Admin'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {users.some((u) => !u.online) && (
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Offline Users</h3>
                                        <div className="space-y-2">
                                            {users
                                                .filter((u) => !u.online)
                                                .map((user) => (
                                                    <div key={user.id} className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>Code</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-muted-foreground">{user.name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        );
    };

    // Return loading screen or main UI based on loading state
    if (isLoading) {
        return <LoadingScreen />;
    }


    return (
        <TooltipProvider>
            {isParticipant && <ParticipantForm token={token} roomId={roomId} />}
            <div className="flex overflow-hidden bg-background ">
                {/* Main Content */}
                <div className={`flex-grow flex flex-col ${!isFullScreen ? "" : ""}`}>
                    {/* Top Toolbar - Pass handleSaveChanges to ToolBar */}
                    <ToolBar
                        roomId={roomId}
                        isConnected={isConnected}
                        isFullScreen={isFullScreen}
                        copied={copied}
                        layout={layout}
                        setIsFullScreen={setIsFullScreen}
                        setLayout={setLayout}
                        saveAndRunCode={saveAndRunCode}
                        handleShareRoom={handleShareRoom}
                        setCopied={setCopied}
                        handleSaveChanges={handleSaveChanges}
                        isSaving={isSaving}
                        token={searchParams.get('token') || ''}
                        showHistory={showHistory}
                        setShowHistory={setShowHistory}

                        showChatSidebar={showChatSidebar}
                        setShowChatSidebar={setShowChatSidebar}
                    />

                    {/* Add the HistoryTracker */}
                    {showHistory && (
                        <div className="fixed right-[320px] top-16 bottom-0 w-[400px] p-4 overflow-auto z-[60]">
                            <HistoryTracker
                                fetchHistory={fetchHistory}
                                historyData={codeHistory}
                                onRestoreVersion={handleRestoreVersion}
                                onPreviewVersion={handlePreviewVersion}
                                onPageChange={handlePageChange}
                                onLimitChange={handleLimitChange}
                            />
                        </div>
                    )}

                    {/* Notification Banners */}
                    <div className="space-y-2 mx-4 my-2">
                        {copied && (
                            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-2 rounded-md flex justify-between items-center">
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Room link copied! Share it with others to collaborate in real-time.
                                </p>
                                <Button variant="ghost" size="sm" onClick={() => setCopied(false)}>
                                    <X size={16} />
                                </Button>
                            </div>
                        )}


                    </div>

                    <div className="flex flex-1 h-full overflow-hidden">
                        {/* Left Side - Code Editor */}
                        {(layout === "editor" || layout === "split") && (
                            <div className={`${layout === "split" ? "w-1/2" : "w-full"} flex flex-col h-full bg-background overflow-hidden`}>
                                <div className="flex-grow min-h-0 overflow-auto p-4">
                                    <Tabs defaultValue="html" className="h-full">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="html">HTML</TabsTrigger>
                                            <TabsTrigger value="css">CSS</TabsTrigger>
                                            <TabsTrigger value="js">JavaScript</TabsTrigger>
                                        </TabsList>


                                        <div className="mb-4">
                                            <ScrollArea className="w-full">
                                                <div className="flex space-x-2 p-2">
                                                    {messages
                                                        .filter((msg, index, self) =>
                                                            index === self.findIndex(m => m.email === msg.email)
                                                        )
                                                        .map((participant) => (
                                                            <Tooltip key={participant.email}>
                                                                <TooltipTrigger>
                                                                    <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                                            {participant.name?.charAt(0)?.toUpperCase() || '?'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="bottom" align="center" className="flex flex-col items-center">
                                                                    <p className="font-medium">{participant.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{participant.email}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                </div>
                                            </ScrollArea>
                                        </div>


                                        <TabsContent value="html" className="m-0 h-full">
                                            <Card className="h-full border-0 shadow-none">
                                                <CardContent className="p-0 h-full">
                                                    <CodeMirror
                                                        value={htmlCode}
                                                        height="70vh"
                                                        extensions={[htmlLang()]}
                                                        theme="dark"
                                                        onChange={(value) => handleCodeChange("html", value)}
                                                        className="rounded-md border h-full"
                                                    />
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="css" className="m-0 h-full">
                                            <Card className="h-full border-0 shadow-none">
                                                <CardContent className="p-0 h-full">
                                                    <CodeMirror
                                                        value={cssCode}
                                                        height="70vh"
                                                        extensions={[cssLang()]}
                                                        theme="dark"
                                                        onChange={(value) => handleCodeChange("css", value)}
                                                        className="rounded-md border h-full"
                                                    />
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="js" className="m-0 h-full">
                                            <Card className="h-full border-0 shadow-none">
                                                <CardContent className="p-0 h-full">
                                                    <CodeMirror
                                                        value={jsCode}
                                                        height="70vh"
                                                        extensions={[jsLang()]}
                                                        theme="dark"
                                                        onChange={(value) => handleCodeChange("js", value)}
                                                        className="rounded-md border h-full"
                                                    />
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        )}

                        {/* Right Side - Live Preview & Console */}
                        {(layout === "preview" || layout === "split") && (
                            <div className={`${layout === "split" ? "w-1/2" : "w-full"} flex flex-col bg-white dark:bg-gray-900 border-l dark:border-gray-800`}>
                                <PreviewPanel
                                    iframeRef={iframeRef}
                                    srcDoc={srcDoc}
                                    showConsole={showConsole}
                                    setShowConsole={setShowConsole}
                                    saveAndRunCode={saveAndRunCode}
                                />

                                {/* Console Output */}
                                {showConsole && (
                                    <div className="h-[300px] border-t dark:border-gray-800 flex flex-col">
                                        <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 border-b">
                                            <div className="text-sm font-medium flex items-center">
                                                <Terminal size={14} className="mr-2" /> Console
                                            </div>
                                            <div className="flex space-x-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button onClick={clearConsole} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                            <Trash size={14} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Clear Console</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-hidden bg-black">
                                            <ScrollArea className="h-full">
                                                <div className="p-2 font-mono text-sm text-white">
                                                    {consoleLogs.length === 0 ? (
                                                        <div className="text-gray-500 italic p-2">No console output yet. Run your code to see logs here.</div>
                                                    ) : (
                                                        consoleLogs.map((log) => (
                                                            <div key={log.id} className={`py-1 ${getConsoleLogClass(log.type)}`}>
                                                                {log.content}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Sidebar (Desktop) */}

                {showChatSidebar && (
                    <div className="fixed right-0 top-0 bottom-0 w-[320px] z-50 shadow-xl transition-all duration-300 ease-in-out">
                        {renderChatSidebar()}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
