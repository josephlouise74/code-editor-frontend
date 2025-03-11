import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { joinParticipantInRoomApiRequest } from "@/lib/api/roomApi";

const formSchema = z.object({
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    name: z.string().min(2, "Name must be at least 2 characters").min(1, "Name is required"),
    role: z.string().min(2, "Role must be at least 2 characters").min(1, "Role is required"),
});


type ParticipantFormValues = z.infer<typeof formSchema>;


export function ParticipantForm({ token, roomId }: any) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            name: "",
            role: "",
        },
    });
    const onSubmit = async (data: ParticipantFormValues) => {
        try {
            setIsSubmitting(true);
            console.log('Form Data:', data);

            const prepareData = {
                ...data,
                token,
                roomId
            };
            console.log('Prepared Data:', prepareData);

            // Call the API to join as participant
            const response = await joinParticipantInRoomApiRequest(prepareData);
            console.log('API call successful');
            console.log("response", response)

            // Store participant details in localStorage
            localStorage.setItem('participantName', data.name);
            localStorage.setItem('participantEmail', data.email);
            localStorage.setItem('currentUserName', data.name);
            localStorage.setItem('currentUserEmail', data.email);

            // Get current URL and params
            const currentParams = new URLSearchParams(searchParams.toString());
            console.log('Current params before modification:', currentParams.toString());

            currentParams.delete("participant"); // Remove participant param

            // Add new participant details to params
            currentParams.set("participantName", data.name);
            currentParams.set("participantEmail", data.email);
            currentParams.set("participantRole", "participant");
            currentParams.set("collaborator", "true"); // Add collaborator parameter
            console.log('Updated params:', currentParams.toString());

            // Rest of the code remains the same...
            const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
            console.log('New URL:', newUrl);

            toast.success(`Welcome ${data.name}! You have successfully joined the room.`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            router.push(newUrl);
        } catch (error) {
            console.error('Error details:', error);
            toast.error("Failed to join as participant");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Dialog open={true} onOpenChange={() => { }} modal={true}>
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Join as Participant</DialogTitle>
                    <DialogDescription>
                        Please fill out your details to join this room. All fields are required.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email*</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="your@email.com"
                                            {...field}
                                            required
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name*</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Your name"
                                            {...field}
                                            required
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role*</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Your role"
                                            {...field}
                                            required
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Joining..." : "Join Room"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}