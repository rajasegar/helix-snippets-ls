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

console.log(`Inside lsp: ${new Date().toTimeString()}`);


const contents = fs.readFileSync(`${os.homedir()}/.config/helix/snippets.toml`,"utf8");
const snippets = toml.parse(contents);

const connection = createConnection(process.stdin, process.stdout);

//Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  console.log("Initializing unity frontend lsp...");
  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );


  const triggerCharacters = Object.keys(snippets);

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: triggerCharacters,
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  console.log(result);
  return result;
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

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  try {
    const docs = documents.get(textDocumentPosition.textDocument.uri);
    if (!docs) throw "failed to find document";
    const languageId = docs.languageId;
    const content = docs.getText();
    const linenr = textDocumentPosition.position.line;
    const line = String(content.split(/\r?\n/g)[linenr]);
    const character = textDocumentPosition.position.character;

    return Object.keys(snippets).map((key,idx) => {
      const label = snippets[key];
      return {
        label,
        kind: CompletionItemKind.Snippet,
        data: idx + 1
      };
    });
    
  } catch (error) {
    connection.console.log(`ERR: ${error}`);
  }

  return [];
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  /*
  if (item.data === 1) {
    item.detail = 'TypeScript details',
      item.documentation = 'TypeScript documentation'
  } else if (item.data === 2) {
    item.detail = 'JavaScript details',
      item.documentation = 'JavaScript documentation'
  }
  */
  return item;
});





documents.listen(connection);

connection.listen();
