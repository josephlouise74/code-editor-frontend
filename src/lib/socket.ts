import { io, Socket } from 'socket.io-client';

interface CodeContent {
    html: string;
    css: string;
    javascript: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface Message {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
}

interface CodeUpdate {
    type: 'html' | 'css' | 'js';
    content: string;
    userId: string;
    userName: string;
    timestamp: number;
}

interface RoomData {
    roomId: string;
    roomName: string;
    password: string;
    codeContent: CodeContent;
    createdAt: number;
    updatedAt: number;
    users: User[];
}

// Update the server URL to match your backend port
export const createSocketConnection = (): Socket => {
    const socket = io('http://localhost:7400', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    // Debug events
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
    });

    return socket;
};

// Add room-users event handler in joinRoom
export const joinRoom = (
    socket: Socket,
    roomId: string,
    user: User,
    callbacks: {
        onCodeUpdate: (update: CodeUpdate) => void;
        onUserJoin: (user: User) => void;
        onUserLeave: (userId: string) => void;
        onError: (error: string) => void;
        onRoomUsers?: (users: User[]) => void; // Add this callback
        onChatMessage?: (message: Message) => void; // Add chat message callback
    }
) => {
    socket.emit('join-room', { roomId, user });

    // Add room users handler
    socket.on('room-users', (users: User[]) => {
        callbacks.onRoomUsers?.(users);
    });

    // Listen for code updates from other users
    socket.on('code-update', (update: CodeUpdate) => {
        if (update.userId !== user.id) {
            callbacks.onCodeUpdate(update);
        }
    });

    // Listen for chat messages
    socket.on('chat-message', (message: Message) => {
        callbacks.onChatMessage?.(message);
    });

    // User join/leave events
    socket.on('user-joined', callbacks.onUserJoin);
    socket.on('user-left', callbacks.onUserLeave);
    socket.on('error', callbacks.onError);

    // Return cleanup function
    return () => {
        socket.off('code-update');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('error');
        socket.off('chat-message');
        socket.off('room-users');
        socket.emit('leave-room', { roomId, userId: user.id });
    };
};

export const emitCodeChange = (
    socket: Socket,
    roomId: string,
    update: Omit<CodeUpdate, 'timestamp'>
) => {
    const codeUpdate: CodeUpdate = {
        ...update,
        timestamp: Date.now(),
    };

    socket.emit('code-update', {
        roomId,
        ...codeUpdate
    });
};

// Add function to send chat messages
export const sendChatMessage = (
    socket: Socket,
    roomId: string,
    message: Omit<Message, 'id' | 'timestamp'>
) => {
    socket.emit('chat-message', {
        roomId,
        message: {
            ...message,
            id: generateId(),
            timestamp: Date.now()
        }
    });
};

export const saveRoomState = async (
    socket: Socket,
    roomData: RoomData
): Promise<void> => {
    return new Promise((resolve, reject) => {
        socket.emit('save-room-state', roomData, (response: { success: boolean; error?: string }) => {
            if (response.success) {
                resolve();
            } else {
                reject(new Error(response.error || 'Failed to save room state'));
            }
        });
    });
};

// Utility function to handle code debouncing
export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
): T => {
    let timeout: NodeJS.Timeout;

    return ((...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T;
};

// Helper function to generate unique IDs
const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};