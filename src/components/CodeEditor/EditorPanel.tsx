import React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { javascript as jsLang } from "@codemirror/lang-javascript";

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

/**
 * Editor panel component
 * 
 * @param {Object} props - Component props
 * @param {string} props.htmlCode - HTML code content
 * @param {string} props.cssCode - CSS code content
 * @param {string} props.jsCode - JavaScript code content
 * @param {Function} props.handleCodeChange - Handle code changes
 */
export default function EditorPanel({ htmlCode, cssCode, jsCode, handleCodeChange }) {
    return (
        <div className="flex-grow min-h-0 overflow-auto p-4">
            <Tabs defaultValue="html" className="h-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="css">CSS</TabsTrigger>
                    <TabsTrigger value="js">JavaScript</TabsTrigger>
                </TabsList>

                <TabsContent value="html" className="m-0 h-full">
                    <Card className="h-full border-0 shadow-none">
                        <CardContent className="p-0 h-full">
                            <CodeMirror
                                value={htmlCode}
                                height="70vh"
                                extensions={[htmlLang()]}
                                theme="dark"
                                onChange={(value) => handleCodeChange("html", value)}
                                className="rounded-md border h-full"
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
                                onChange={(value) => handleCodeChange("css", value)}
                                className="rounded-md border h-full"
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
                                onChange={(value) => handleCodeChange("js", value)}
                                className="rounded-md border h-full"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}