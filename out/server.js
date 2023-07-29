#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("node:fs");
const toml = require("toml");
const os = require("node:os");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const node_1 = require("vscode-languageserver/node");
const logger_1 = require("./logger");
const logger = new logger_1.default();
const configPath = `${os.homedir()}/.config/helix`;
logger.log(`Config:  ${configPath}`);
const contents = fs.readFileSync(`${configPath}/snippets.toml`, "utf8");
const snippetsConfig = toml.parse(contents);
const { sources } = snippetsConfig;
logger.log(`Sources: ${sources.dirs[0]}`);
const snippetData = fs.readFileSync(`${configPath}/snippets/${sources.dirs[0]}/snippets/markdown.json`, 'utf8');
const snippets = JSON.parse(snippetData);
const connection = (0, node_1.createConnection)(process.stdin, process.stdout);
//Create a simple text document manager
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
// Function to provide snippet completions
function provideCompletionItems(params) {
    const document = documents.get(params.textDocument.uri);
    // Retrieve snippets from the extension settings
    const snippets = getSnippetsFromSettings();
    // Process snippets and convert them into CompletionItem objects
    const completionItems = snippets.map((snippet) => {
        const completionItem = {
            label: snippet.prefix,
            kind: node_1.CompletionItemKind.Snippet,
            insertText: snippet.body,
        };
        return completionItem;
    });
    return completionItems;
}
// Function to get snippets from user settings or extensions
function getSnippetsFromSettings() {
    // You may need to implement this function based on how the snippets are stored in settings or extensions.
    // For simplicity, let's assume we have hardcoded snippets here.
    const newSnippets = [];
    // Transform snippets for prefix array values
    Object.keys(snippets).forEach(k => {
        const { prefix, body, description } = snippets[k];
        if (Array.isArray(prefix)) {
            prefix.forEach(p => {
                newSnippets.push({
                    prefix: p,
                    body: Array.isArray(body) ? body.join('\n') : body,
                    description
                });
            });
        }
        else {
            newSnippets.push({
                prefix,
                body: Array.isArray(body) ? body.join('\n') : body,
                description
            });
        }
    });
    logger.log(JSON.stringify(newSnippets));
    return newSnippets;
    /*
      return [
      { prefix: 'for', body: 'for (let i = 0; i < array.length; i++) {\n\t$1\n}' },
      { prefix: 'if', body: 'if ($1) {\n\t$2\n}' },
      { prefix: "h1", body: "# ${0}" },
      // Add more snippets here as needed
    ];
    */
}
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
            },
        },
    };
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders((_event) => {
            connection.console.log("Workspace folder change event received.");
        });
    }
});
connection.onCompletion(provideCompletionItems);
connection.onCompletionResolve((item) => {
    return item;
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map