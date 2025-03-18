"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Lock, Hash, Loader2, Mail, ArrowRight } from "lucide-react";
import { createRoomApi } from "@/lib/api/roomApi";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";
import Image from "next/image";
import unicode from '../../../../public/unicode.png';

// Update the schema to include email
const roomSchema = z.object({
    roomName: z.string().min(3, "Room name must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Please enter a valid email address"),
});

type RoomFormValues = z.infer<typeof roomSchema>;

export default function CreateRoomForm() {
    const router = useRouter();
    const form = useForm<RoomFormValues>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            roomName: "",
            password: "",
            email: "",
        },
    });

    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: RoomFormValues) => {
        setIsLoading(true);
        try {
            const response = await createRoomApi({
                roomName: data.roomName,
                password: data.password,
                email: data.email
            });

            console.log("Room Created:", response);
            form.reset();

            // Add timeout and navigation
            setTimeout(() => {
                router.push('/');  // Navigate to sign in page
            }, 1000);

        } catch (error) {
            console.error("Failed to create room:", error);
        } finally {
            setIsLoading(false);
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
                                Create Room
                            </span>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="roomName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label className="text-white font-medium">Room Name</Label>
                                            <FormControl>
                                                <div className="relative">
                                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter room name"
                                                        className="pl-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white text-gray-800 placeholder:text-gray-400 rounded-md"
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
                                                        placeholder="Enter password"
                                                        className="pl-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white text-gray-800 placeholder:text-gray-400 rounded-md"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label className="text-white font-medium">Email</Label>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        placeholder="Enter your email"
                                                        className="pl-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white text-gray-800 placeholder:text-gray-400 rounded-md"
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
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="transition-transform group-hover:scale-105">Create Room</span>
                                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-300">
                                Already have a room?{' '}
                                <Link
                                    href="/"
                                    className={`${theme.linkText} ${theme.linkHover} font-medium relative ${theme.linkUnderline}`}
                                >
                                    Join a room
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
}
