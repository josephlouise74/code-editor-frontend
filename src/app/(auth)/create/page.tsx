"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Lock, Hash } from "lucide-react";
import { createRoomApi } from "@/lib/api/roomApi";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Create Room</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="roomName"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Room Name</Label>
                                        <FormControl>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                                                <Input
                                                    {...field}
                                                    placeholder="Enter room name"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Password</Label>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="Enter password"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Add the new email field */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Email</Label>
                                        <FormControl>
                                            <div className="relative">
                                                <svg
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Room"}
                            </Button>
                        </form>
                    </Form>

                    {/* Add this new section */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have a room?{' '}
                            <Link
                                href="/"
                                className="text-black hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                            >
                                Join room
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
