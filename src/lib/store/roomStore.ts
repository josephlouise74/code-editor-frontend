import { makeAutoObservable } from 'mobx';
import { getRoomData, joinRoomApi } from '@/lib/api/roomApi';
import { toast } from 'react-toastify';

interface CodeContent {
    html: string;
    css: string;
    javascript: string;
}

interface RoomData {
    roomId: string;
    roomName: string;
    accessCode: string;
    role: 'participant' | 'host';
    codeContent: CodeContent;
    token: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: RoomData;
}

export class RoomStore {
    currentRoom: RoomData | null = null;
    isLoading: boolean = false;

    constructor() {
        makeAutoObservable(this);
    }

    setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    setCurrentRoom(roomData: RoomData) {
        this.currentRoom = roomData;
    }

    clearRoom() {
        this.currentRoom = null;
    }

    async joinRoom(data: { accessCode: string; password: string }) {
        try {
            this.setLoading(true);
            const response = await joinRoomApi(data);

            if (response?.success) {
                this.setCurrentRoom(response.data);
                toast.success(response.message || 'Successfully joined the room!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                return response.data;
            }
        } catch (error) {
            toast.error('Failed to join room. Please try again.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // Computed values for accessing store data
    get isInRoom(): boolean {
        return !!this.currentRoom;
    }

    get userRole(): string | null {
        return this.currentRoom?.role ?? null;
    }

    get currentCodeContent(): CodeContent | null {
        return this.currentRoom?.codeContent ?? null;
    }

    get currentRoomDetails() {
        return {
            roomId: this.currentRoom?.roomId ?? null,
            roomName: this.currentRoom?.roomName ?? null,
            accessCode: this.currentRoom?.accessCode ?? null,
            role: this.currentRoom?.role ?? null
        };
    }

    get token(): string | null {
        return this.currentRoom?.token ?? null;
    }

    async fetchRoomData(roomId: string, token: string) {
        try {
            this.setLoading(true);
            const response = await getRoomData({ roomId, token });

            if (response?.success) {
                this.setCurrentRoom({
                    roomId: response.data.roomId,
                    roomName: response.data.roomName,
                    accessCode: response.data.accessCode,
                    role: 'participant', // Default role when fetching
                    codeContent: {
                        html: response.data.codeContent.html,
                        css: response.data.codeContent.css,
                        javascript: response.data.codeContent.javascript
                    },
                    token: token
                });
                return response.data;
            }
        } catch (error) {
            this.clearRoom();
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
}

export const roomStore = new RoomStore();