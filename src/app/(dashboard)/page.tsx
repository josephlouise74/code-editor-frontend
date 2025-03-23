"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roomStore } from "@/lib/store/roomStore";
import { theme } from "@/lib/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Hash, Loader2, Lock } from "lucide-react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import unicode from '../../../public/unicode.png';

// Schema definitions
const joinRoomSchema = z.object({
    accessCode: z.string().min(3, "Access code must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type JoinRoomFormValues = z.infer<typeof joinRoomSchema>;

const participantSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
});

const JoinRoomForm = observer(() => {
    const router = useRouter();

    // Form setup
    const form = useForm<JoinRoomFormValues>({
        resolver: zodResolver(joinRoomSchema),
        defaultValues: {
            accessCode: "",
            password: "",
        },
    });




    const onSubmit = async (data: JoinRoomFormValues) => {
        try {
            const response = await roomStore.joinRoom(data);

            if (response && response.roomId) {
                form.reset();
                localStorage.setItem('host', 'Host');
                localStorage.setItem('role', 'host');
                localStorage.setItem('adminEmail', response.email);
                localStorage.setItem('adminName', response.name);
                console.log('response', response)
                router.push(
                    `/room/${response.roomId}?token=${encodeURIComponent(response.token)}&host=${encodeURIComponent('Host')}&adminEmail=${encodeURIComponent(response.email)}&collaborator=false`
                );
            }
        } catch (error) {
            console.error("Failed to join room:", error);
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-4">
            <div className="w-full max-w-md">

                <Card className={`border-2 ${theme.borderPrimary} shadow-lg ${theme.shadowPrimary} bg-black`}>
                    <CardHeader className={`pb-6 border-b ${theme.borderPrimary}`}>
                        <div className="flex justify-center">
                            <div className="relative h-28 w-28">
                                <Image
                                    src={unicode}
                                    alt="Unicode Logo"
                                    className="object-contain"
                                    fill
                                    priority
                                />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-center">
                            <span className="text-white">
                                Join Room
                            </span>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="accessCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label className="text-white font-medium">Room Code</Label>
                                            <FormControl>
                                                <div className="relative">
                                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter room code"
                                                        className="pl-10 border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-400 rounded-md"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label className="text-white font-medium">Password</Label>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="Enter room password"
                                                        className="pl-10 border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-800 placeholder:text-gray-400 rounded-md"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold bg-red-600 hover:bg-red-700 text-white hover:text-gray-100 transition-all duration-300 rounded-md shadow-md flex items-center justify-center gap-2 group"
                                    disabled={roomStore.isLoading}
                                >
                                    {roomStore.isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Joining...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="transition-transform group-hover:scale-105">Join Room</span>
                                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-300">
                                Don't have a room?{' '}
                                <Link
                                    href="/create"
                                    className={`${theme.linkText} ${theme.linkHover} font-medium relative ${theme.linkUnderline}`}
                                >
                                    Create a new room
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        Made with ❤️ for the best collaboration experience
                    </p>
                </div>


            </div>
        </div>
    );
});

export default JoinRoomForm;