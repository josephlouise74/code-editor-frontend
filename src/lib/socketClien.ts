import { io, Socket } from 'socket.io-client';

class SocketClient {
    private static instance: SocketClient;
    private socket: Socket | null = null;
    private readonly SOCKET_URL = 'http://localhost:7400';

    private constructor() {
        this.initializeSocket();
    }

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    private initializeSocket() {
        this.socket = io(this.SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
    }

    public joinRoom(roomId: string) {
        if (this.socket) {
            this.socket.emit('join-room', roomId);
        }
    }

    public emitCodeUpdate(data: { room: string; type: string; content: string }) {
        if (this.socket) {
            this.socket.emit('code-update', data);
        }
    }

    public onCodeChanged(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on('code-changed', callback);
        }
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

export default SocketClient;