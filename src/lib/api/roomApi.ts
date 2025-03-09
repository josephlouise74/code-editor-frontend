import axios from 'axios';
import { toast } from 'react-toastify';

interface CreateRoomData {
    roomName: string;
    password: string;
    email: string;
}

const handleError = (error: any) => {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    throw error;
};

export const createRoomApi = async (data: CreateRoomData) => {
    try {
        const response = await axios.post(
            'http://localhost:7400/api/v1/room/create',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        toast.success('Room created successfully!');
        return response.data;
    } catch (error) {
        console.log("error", error)
        handleError(error);
    }
};


export const joinRoomApi = async (data: any) => {
    try {
        const response = await axios.post(
            'http://localhost:7400/api/v1/room/join',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        toast.success('Successfully joined the room!'); // Updated success message
        return response.data;
    } catch (error) {
        console.log("error", error)
        handleError(error);
    }
};


export const updateSaveChangesCodeApi = async (data: {
    roomId: string;
    roomName: string;
    accessCode: string;
    role: string;
    codeContent: {
        html: string;
        css: string;
        javascript: string;
    };
    token: string;
}) => {
    try {
        console.log("data", data)
        const response = await axios.patch(
            'http://localhost:7400/api/v1/room/update-code', // Fixed endpoint URL
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}` // Added token to headers
                },
            }
        );

        if (response.data.success) {
            toast.success('Changes saved successfully!'); // Updated success message
        }

        return response.data;
    } catch (error) {
        console.error("Error updating code:", error);
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || 'Failed to update code';
            toast.error(message);
        } else {
            toast.error('An unexpected error occurred');
        }
        throw error;
    }
};

interface GetRoomDataResponse {
    success: boolean;
    message: string;
    data: {
        roomId: string;
        roomName: string;
        accessCode: string;
        participants: any[];
        codeContent: {
            html: string;
            css: string;
            javascript: string;
        };
        createdAt: string;
        updatedAt: string;
        lastModifiedBy: string;
        history: any[];
    };
}

export const getRoomData = async (data: { roomId: string; token: string }): Promise<GetRoomDataResponse> => {
    try {
        const response = await axios.get(
            `http://localhost:7400/api/v1/room/get-room-data/${data.roomId}/${data.token}`,
            {
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            }
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch room data');
        }

        return response.data;
    } catch (error) {
        console.error("Error fetching room data:", error);
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || 'Failed to fetch room data';
            toast.error(message);
        } else {
            toast.error('An unexpected error occurred');
        }
        throw error;
    }
};


interface ParticipantData {
    email: string;
    name: string;
    role: string;
    token: string;
    roomId: string;
}

export const joinParticipantInRoomApiRequest = async (data: ParticipantData) => {
    try {
        const response = await axios.post(
            'http://localhost:7400/api/v1/room/join-participant',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`
                },
            }
        );

        if (response.data.success) {
            toast.success('Successfully joined as participant!');
        }

        return response.data;
    } catch (error) {
        console.error("Error joining as participant:", error);
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || 'Failed to join as participant';
            toast.error(message);
        } else {
            toast.error('An unexpected error occurred');
        }
        throw error;
    }
};