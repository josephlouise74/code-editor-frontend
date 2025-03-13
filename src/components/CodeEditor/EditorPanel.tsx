import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { javascript as jsLang } from "@codemirror/lang-javascript";
import { Badge } from "@/components/ui/badge";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

interface EditorPanelProps {
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    handleCodeChange: (type: 'html' | 'css' | 'js', value: string) => void;
    activeUsers?: { id: string; name: string; email: string }[];
    currentUserId?: string;
}

export default function EditorPanel({
    htmlCode,
    cssCode,
    jsCode,
    handleCodeChange,
    activeUsers = [],
    currentUserId = ""
}: EditorPanelProps) {
    const [activeTab, setActiveTab] = useState<string>("html");
    const [lastEditedBy, setLastEditedBy] = useState<{ [key: string]: string }>({
        html: "",
        css: "",
        js: ""
    });

    const handleChange = React.useCallback((type: 'html' | 'css' | 'js', value: string) => {
        console.log(`${type} code changed:`, value); // Debug log
        handleCodeChange(type, value);
        setLastEditedBy(prev => ({ ...prev, [type]: currentUserId }));
    }, [handleCodeChange, currentUserId]);

    // Track active users per tab
    const getActiveUsersForTab = (tab: string) => {
        return activeUsers.filter(user => user.id !== currentUserId).slice(0, 3);
    };

    return (
        <div className="flex-grow min-h-0 overflow-auto p-4">
            <Tabs
                defaultValue="html"
                className="h-full"
                value={activeTab}
                onValueChange={setActiveTab}
            >
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="html">HTML</TabsTrigger>
                        <TabsTrigger value="css">CSS</TabsTrigger>
                        <TabsTrigger value="js">JavaScript</TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        {getActiveUsersForTab(activeTab).map(user => (
                            <Badge key={user.id} variant="outline" className="bg-blue-100">
                                {user.name || user.email.split('@')[0]}
                            </Badge>
                        ))}
                    </div>
                </div>

                <TabsContent value="html" className="m-0 h-full">
                    <Card className="h-full border-0 shadow-none">
                        <CardContent className="p-0 h-full">
                            <CodeMirror
                                value={htmlCode}
                                height="70vh"
                                extensions={[htmlLang()]}
                                theme="dark"
                                onChange={(value) => handleChange("html", value)}
                                className="rounded-md border h-full"
                                basicSetup={{
                                    lineNumbers: true,
                                    highlightActiveLineGutter: true,
                                    highlightActiveLine: true,
                                    autocompletion: true,
                                    foldGutter: true,
                                    indentOnInput: true,
                                    bracketMatching: true,
                                    closeBrackets: true,
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="css" className="m-0 h-full">
                    <Card className="h-full border-0 shadow-none">
                        <CardContent className="p-0 h-full">
                            <CodeMirror
                                value={cssCode}
                                height="70vh"
                                extensions={[cssLang()]}
                                theme="dark"
                                onChange={(value) => handleChange("css", value)}
                                className="rounded-md border h-full"
                                basicSetup={{
                                    lineNumbers: true,
                                    highlightActiveLineGutter: true,
                                    highlightActiveLine: true,
                                    autocompletion: true,
                                    foldGutter: true,
                                    indentOnInput: true,
                                    bracketMatching: true,
                                    closeBrackets: true,
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="js" className="m-0 h-full">
                    <Card className="h-full border-0 shadow-none">
                        <CardContent className="p-0 h-full">
                            <CodeMirror
                                value={jsCode}
                                height="70vh"
                                extensions={[jsLang()]}
                                theme="dark"
                                onChange={(value) => handleChange("js", value)}
                                className="rounded-md border h-full"
                                basicSetup={{
                                    lineNumbers: true,
                                    highlightActiveLineGutter: true,
                                    highlightActiveLine: true,
                                    autocompletion: true,
                                    foldGutter: true,
                                    indentOnInput: true,
                                    bracketMatching: true,
                                    closeBrackets: true,
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}