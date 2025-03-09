/**
 * @typedef {Object} CodeState
 * @property {string} htmlCode - HTML code content
 * @property {string} cssCode - CSS code content
 * @property {string} jsCode - JavaScript code content
 * @property {string} srcDoc - Generated source document for the iframe
 */

/**
 * Hook to manage code editor state and operations
 * @param {Object} options - Hook options
 * @param {string} options.roomId - Current room ID
 * @param {Object} options.socket - Socket.io connection
 * @param {boolean} options.isConnected - Connection status
 * @returns {Object} Code editor state and methods
 */
import { useState, useEffect, useRef } from "react";

export function useCodeEditor({ roomId, socket, isConnected }: any) {
  // Default code samples
  const defaultHtml = "<h1>Hello World</h1>\n<button id=\"testBtn\">Test Console</button>";
  const defaultCss = "h1 { color: blue; }\nbutton { padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }";
  const defaultJs = "document.getElementById('testBtn').addEventListener('click', () => {\n  console.log('Button clicked!');\n  console.error('This is an error');\n  console.warn('This is a warning');\n});";

  // State
  const [htmlCode, setHtmlCode] = useState(defaultHtml);
  const [cssCode, setCssCode] = useState(defaultCss);
  const [jsCode, setJsCode] = useState(defaultJs);
  const [srcDoc, setSrcDoc] = useState("");
  const [layout, setLayout] = useState("split"); // "split", "editor", "preview"

  const iframeRef = useRef(null);

  // Handle code changes and emit to other users
  const handleCodeChange = (type: any, value: any) => {
    if (type === "html") setHtmlCode(value);
    if (type === "css") setCssCode(value);
    if (type === "js") setJsCode(value);

    // Emit changes to other users in the room
    if (isConnected && socket) {
      socket.emit("code-update", {
        room: roomId,
        type,
        content: value,
      });
    }
  };

  // Add this new function
  const handleSaveChanges = () => {
    // Log the current code state
    console.log('Saving code changes:');
    console.log('HTML:', htmlCode);
    console.log('CSS:', cssCode);
    console.log('JavaScript:', jsCode);

    // If connected, emit save event
    if (isConnected && socket) {
      socket.emit('save-changes', {
        roomId,
        codeContent: {
          html: htmlCode,
          css: cssCode,
          javascript: jsCode
        }
      });
    }
  };

  // Save and run code
  const saveAndRunCode = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current as HTMLIFrameElement;
      iframe.src = "about:blank";
      setTimeout(() => {
        iframe.srcdoc = srcDoc;
      }, 50);
    }
  };

  // Update the live preview with a debounce and console intercept script
  useEffect(() => {
    const timeout = setTimeout(() => {
      const consoleInterceptScript = `
        <script>
          const originalConsole = console;
          console = {
            log: function() {
              originalConsole.log.apply(originalConsole, arguments);
              window.parent.postMessage({
                type: 'console',
                logType: 'log',
                content: Array.from(arguments).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
              }, '*');
            },
            error: function() {
              originalConsole.error.apply(originalConsole, arguments);
              window.parent.postMessage({
                type: 'console',
                logType: 'error',
                content: Array.from(arguments).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
              }, '*');
            },
            warn: function() {
              originalConsole.warn.apply(originalConsole, arguments);
              window.parent.postMessage({
                type: 'console',
                logType: 'warn',
                content: Array.from(arguments).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
              }, '*');
            },
            info: function() {
              originalConsole.info.apply(originalConsole, arguments);
              window.parent.postMessage({
                type: 'console',
                logType: 'info',
                content: Array.from(arguments).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
              }, '*');
            }
          };
        </script>
      `;

      const source = `
        <html>
          <head>
            <style>${cssCode}</style>
            ${consoleInterceptScript}
          </head>
          <body>
            ${htmlCode}
            <script>${jsCode}<\/script>
          </body>
        </html>
      `;
      setSrcDoc(source);
    }, 250);
    return () => clearTimeout(timeout);
  }, [htmlCode, cssCode, jsCode]);

  return {
    htmlCode,
    cssCode,
    jsCode,
    srcDoc,
    layout,
    iframeRef,
    setLayout,
    handleCodeChange,
    saveAndRunCode,
  };
}