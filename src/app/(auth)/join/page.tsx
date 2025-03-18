"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Lock, Hash, Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { roomStore } from "@/lib/store/roomStore";
import { useRouter } from "next/navigation";

const joinRoomSchema = z.object({
    accessCode: z.string().min(3, "Access code must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type JoinRoomFormValues = z.infer<typeof joinRoomSchema>;

const participantSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
});

type ParticipantFormValues = z.infer<typeof participantSchema>;




const JoinRoomForm = observer(() => {



    const router = useRouter();
    const form = useForm<JoinRoomFormValues>({
        resolver: zodResolver(joinRoomSchema),
        defaultValues: {
            accessCode: "",
            password: "",
        },
    });

    // Add these states after the router declaration
    const [showParticipantDialog, setShowParticipantDialog] = useState(false);
    const [roomData, setRoomData] = useState<{ roomId: string; token: string } | null>(null);

    const participantForm = useForm<ParticipantFormValues>({
        resolver: zodResolver(participantSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });


    // Add this new function for participant form submission
    const onParticipantSubmit = async (data: ParticipantFormValues) => {
        try {
            participantForm.reset();
            setShowParticipantDialog(false);

            if (roomData) {
                router.push(`/room/${roomData.roomId}?token=${encodeURIComponent(roomData.token)}&name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}`);
            }
        } catch (error) {
            console.error("Failed to save participant:", error);
        }
    };


    const onSubmit = async (data: JoinRoomFormValues) => {
        try {
            const response = await roomStore.joinRoom(data);
            if (response && response.roomId) {
                form.reset();
                localStorage.setItem('host', 'Host');
                router.push(`/room/${response.roomId}?token=${encodeURIComponent(response.token)}&host=${encodeURIComponent('Host')}`);
            }
        } catch (error) {
            console.error("Failed to join room:", error);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md border-2 border-red-600 dark:border-red-800 shadow-lg transition-all duration-300 hover:shadow-xl">
                <CardHeader className="space-y-1 pb-6 border-b border-red-200 dark:border-red-900 bg-gradient-to-r from-red-500 to-red-700 text-white">
                    <CardTitle className="text-2xl font-bold text-center">
                        ssss
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 bg-white dark:bg-gray-800">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="accessCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-gray-800 dark:text-gray-200 font-medium">Room Code</Label>
                                        <FormControl>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400" size={20} />
                                                <Input
                                                    {...field}
                                                    placeholder="Enter room code"
                                                    className="pl-10 border-2 border-gray-300 dark:border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 transition-all duration-200 bg-white dark:bg-gray-700 text-black dark:text-white"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-gray-800 dark:text-gray-200 font-medium">Password</Label>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400" size={20} />
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="Enter room password"
                                                    className="pl-10 border-2 border-gray-300 dark:border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 transition-all duration-200 bg-white dark:bg-gray-700 text-black dark:text-white"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-md shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                                disabled={roomStore.isLoading}
                            >
                                {roomStore.isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    'Join Room'
                                )}
                            </Button>

                            <div className="text-center mt-4">
                                <a href="/" className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors duration-200 underline-offset-2 hover:underline">
                                    Back to Home
                                </a>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
});

export default JoinRoomForm;