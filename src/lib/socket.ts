import { Socket } from 'socket.io-client';

interface CodeContent {
    html: string;
    css: string;
    javascript: string;
}

interface User {
    id: string;
    name: string;
}

interface Message {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
}

interface RoomData {
    roomId: string;
    roomName: string;
    password: string;
    codeContent: CodeContent;
    createdAt: number;
    updatedAt: number;
}

/**
 * Creates a mock socket connection
 * @returns A socket connection instance
 */
export const createSocketConnection = (): Socket => {
    // Mock socket functions
    const socket = {
        emit: (event: string, data: any): void => console.log(`Socket emitted: ${event}`, data),
        on: (event: string, callback: (data: any) => void): void => { /* implementation */ },
        off: (event: string, callback: (data: any) => void): void => { /* implementation */ },
    } as Socket;

    return socket;
};

/**
 * Saves room data to the database
 * @param roomData The room data to save
 * @returns A promise that resolves when the save operation is complete
 */
export const saveRoomData = async (roomData: RoomData): Promise<void> => {
    try {
        // Here you would implement your Firebase save logic
        console.log('Saving room data to Firebase:', roomData);
        // Example Firebase implementation:
        // await setDoc(doc(db, 'rooms', roomData.roomId), roomData);
    } catch (error: any) {
        console.error('Error saving room data:', error);
        throw error;
    }
};

/**
 * Connects to a room and sets up event listeners
 * @returns A cleanup function to disconnect from the room
 */
export const connectToRoom = (
    roomId: string,
    setIsConnected: (connected: boolean) => void,
    addSystemMessage: (message: string) => void,
    setHtmlCode: (code: string) => void,
    setCssCode: (code: string) => void,
    setJsCode: (code: string) => void,
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
    setUsers: (users: User[] | ((prev: User[]) => User[])) => void,
    socket: Socket
): () => void => {
    console.log(`Connecting to room: ${roomId}`);

    // Initial room data fetch
    const fetchRoomData = async (): Promise<void> => {
        try {
            // Here you would implement your Firebase fetch logic
            // Example:
            // const roomDoc = await getDoc(doc(db, 'rooms', roomId));
            // if (roomDoc.exists()) {
            //     const data = roomDoc.data() as RoomData;
            //     setHtmlCode(data.codeContent.html);
            //     setCssCode(data.codeContent.css);
            //     setJsCode(data.codeContent.javascript);
            // }
        } catch (error: any) {
            console.error('Error fetching room data:', error);
            addSystemMessage('Error loading room data. Please try again.');
        }
    };

    // Connect and fetch initial data
    setTimeout(async () => {
        await fetchRoomData();
        setIsConnected(true);
        addSystemMessage(`Welcome to room ${roomId}! Share this link with others to collaborate.`);
    }, 1000);

    // Handle code updates
    socket.on("code-update", (data: { type: string; content: string; userId: string }) => {
        switch (data.type) {
            case "html":
                setHtmlCode(data.content);
                break;
            case "css":
                setCssCode(data.content);
                break;
            case "js":
                setJsCode(data.content);
                break;
            default:
                console.warn(`Unknown code type: ${data.type}`);
                break;
        }
    });

    // Handle chat messages
    socket.on("chat-message", (data: Message) => {
        setMessages((prev) => [...prev, data]);
    });

    // Handle user joining
    socket.on("user-joined", (user: User) => {
        setUsers((prev) => [...prev, user]);
        addSystemMessage(`${user.name} has joined the room`);
    });

    // Handle save changes
    socket.on("save-changes", async (data: CodeContent) => {
        try {
            const roomData: RoomData = {
                roomId,
                roomName: '', // You'll need to pass this from your form
                password: '', // You'll need to pass this from your form
                codeContent: data,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            await saveRoomData(roomData);
            addSystemMessage('Changes saved successfully!');
        } catch (error: any) {
            addSystemMessage('Error saving changes. Please try again.');
        }
    });

    // Cleanup function
    return () => {
        socket.off("code-update");
        socket.off("chat-message");
        socket.off("user-joined");
        socket.off("save-changes");
    };
};

/**
 * Emits code changes to the socket server
 */
export const emitCodeChange = (
    socket: Socket,
    type: 'html' | 'css' | 'js',
    content: string,
    roomId: string,
    userId: string
): void => {
    socket.emit('code-update', {
        type,
        content,
        roomId,
        userId,
        timestamp: Date.now()
    });
};

/**
 * Saves changes to Firebase
 */
export const saveChanges = async (
    roomId: string,
    codeContent: CodeContent,
    password: string,
    roomName: string = ''
): Promise<void> => {
    try {
        const roomData: RoomData = {
            roomId,
            roomName,
            password,
            codeContent,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await saveRoomData(roomData);
        console.log('Changes saved successfully!');
    } catch (error: any) {
        console.error('Error saving changes:', error);
        throw error;
    }
};