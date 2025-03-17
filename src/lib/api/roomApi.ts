import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';

interface CreateRoomData {
    roomName: string;
    password: string;
    email: string;
}

const baseUrl =  "https://code-editor-backend-jqof.onrender.com/api/v1";


/* const baseUrl = "http://localhost:7400/api/v1"; */
/* const baseUrl = "https://code-editor-backend-jqof.onrender.com/api/v1"; */

const handleError = (error: any) => {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    throw error;
};

export const createRoomApi = async (data: CreateRoomData) => {
    try {
        const response = await axios.post(
            `${baseUrl}/room/create`,
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
        handleError(error as AxiosError);
    }
};

interface JoinRoomData {
    roomId: string;
    password: string;
    email: string;
}

export const joinRoomApi = async (data: any) => {
    try {
        const response = await axios.post(
            `${baseUrl}/room/join`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        toast.success('Successfully joined the room!');
        return response.data;
    } catch (error) {
        handleError(error as AxiosError);
    }
};

interface UpdateCodeData {
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
}

export const updateSaveChangesCodeApi = async (data: any) => {
    try {
        const response = await axios.patch(
            `${baseUrl}/room/update-code`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`
                },
            }
        );

        if (response.data.success) {
            /*  toast.success('Changes saved successfully!'); */
        }

        return response.data;
    } catch (error) {
        handleError(error as AxiosError);
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
            `${baseUrl}/room/get-room-data/${data.roomId}/${data.token}`,
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
        handleError(error as AxiosError);
        throw error;
    }
};

export const joinParticipantInRoomApiRequest = async (data: any) => {
    try {
        const response = await axios.post(
            `${baseUrl}/room/join-participant`,
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
        handleError(error as AxiosError);
    }
};

interface ChatMessageData {
    roomId: string;
    token: string;
    name: string;
    email: string;
    message: string;
}

export const sendNewMessageInGroupChatApiRequest = async (data: ChatMessageData) => {
    try {
        const response = await axios.post(
            `${baseUrl}/room/send-message`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`
                },
            }
        );

        if (response.data.success) {
            toast.success('Message sent successfully!');
        }

        return response.data;
    } catch (error) {
        handleError(error as AxiosError);
    }
};

export const getAllChats = async (roomId: string) => {
    try {
        const response = await axios.get(
            `${baseUrl}/room/get-all-chats/${roomId}`
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch chat data');
        }

        return response.data;
    } catch (error) {
        handleError(error as AxiosError);
    }
};


interface HistoryParams {
    page?: number;
    limit?: number;
    sortBy?: 'asc' | 'desc';
}

import ky from 'ky';

interface HistoryResponse {
    success: boolean;
    message: string;
    data: {
        roomId: string;
        history: Array<{
            id: string;
            version: number;
            codeContent: {
                html: string;
                css: string;
                javascript: string;
            };
            timestamp: string;
            modifiedBy: string;
        }>;
        pagination: {
            currentPage: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
            nextPage: number | null;
            prevPage: number | null;
            totalItems: number;
            itemsPerPage: number;
        };
        meta: {
            timestamp: string;
            query: {
                page: number;
                limit: number;
                sortBy: string;
            };
        };
    };
}

export const getAllHistoryCode = async (
    roomId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'asc' | 'desc' = 'desc'
): Promise<HistoryResponse> => {
    try {
        const searchParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy
        });

        const response = await ky.get(`${baseUrl}/room/history-code/${roomId}`, {
            searchParams,
            timeout: 10000,
            retry: {
                limit: 2,
                methods: ['get'],
                statusCodes: [408, 429, 500, 502, 503, 504]
            },
            hooks: {
                beforeError: [
                    error => {
                        const { response } = error;
                        if (response && response.body) {
                            const message: any = 'Failed to fetch history data';
                            toast.error(message);
                        }
                        return error;
                    }
                ]
            }
        }).json<HistoryResponse>();

        if (!response.success) {
            throw new Error(response.message || 'Failed to fetch history data');
        }

        return response;
    } catch (error: any) {
        if (error instanceof Error) {
            toast.error(error.message);
        } else {
            toast.error('An unexpected error occurred');
        }
        throw error;
    }
};