#!/usr/bin/env node

import * as fs from 'node:fs';
import * as toml from 'toml';
import * as os from 'node:os';
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind

} from "vscode-languageserver/node";

import Logger from './logger';

const logger = new Logger();



const configPath =  `${os.homedir()}/.config/helix`;
logger.log(`Config:  ${configPath}`);
const contents = fs.readFileSync(`${configPath}/snippets.toml`,"utf8");
const snippetsConfig = toml.parse(contents);
const {sources} = snippetsConfig;
logger.log(`Sources: ${sources.dirs[0]}`);
const snippetData = fs.readFileSync(`${configPath}/snippets/${sources.dirs[0]}/snippets/markdown.json`, 'utf8');
const snippets = JSON.parse(snippetData);

const connection = createConnection(process.stdin, process.stdout);

//Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

// Function to provide snippet completions
function provideCompletionItems(params: TextDocumentPositionParams): CompletionItem[] {
  const document = documents.get(params.textDocument.uri);

  // Retrieve snippets from the extension settings
  const snippets = getSnippetsFromSettings();

  // Process snippets and convert them into CompletionItem objects
  const completionItems: CompletionItem[] = snippets.map((snippet: any) => {
    const completionItem: CompletionItem = {
      label: snippet.prefix,
      kind: CompletionItemKind.Snippet,
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

  const newSnippets: any = [];

  // Transform snippets for prefix array values
  Object.keys(snippets).forEach(k => {
    const { prefix, body, description } = snippets[k];
    if(Array.isArray(prefix)) {
      prefix.forEach(p => {
        newSnippets.push({
          prefix: p,
          body: Array.isArray(body) ? body.join('\n') : body,
          description
        })
      })
      
    } else {
      newSnippets.push({
        prefix,
        body: Array.isArray(body) ? body.join('\n') : body,
        description
        });
    }
  })

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
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
});


connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});


connection.onCompletion(provideCompletionItems);


connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});


documents.listen(connection);

connection.listen();
