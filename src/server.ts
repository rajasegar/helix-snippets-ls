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
  InsertTextFormat,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind

} from "vscode-languageserver/node";



const configPath =  `${os.homedir()}/.config/helix`;
const contents = fs.readFileSync(`${configPath}/snippets.toml`,"utf8");
const snippetsConfig = toml.parse(contents);
const {sources} = snippetsConfig;
const snippetData = fs.readFileSync(`${configPath}/snippets/${sources.dirs[0]}/snippets/markdown.json`, 'utf8');
const snippets = JSON.parse(snippetData);

const connection = createConnection(process.stdin, process.stdout);

//Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );


  const triggers =  Object.keys(snippets)
  .map((key) => {
  return snippets[key].prefix;

});

  const triggerCharacters = triggers.flat();

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

    const left = 0;
    const right = line.length;
    const range = {
      start: {
        line: linenr,
        character: left,
      },
      end: {
        line: linenr,
        character: right,
      },
    };

    return Object.keys(snippets).map((key,idx) => {
      const textResult = snippets[key].body;
      return {
        label:key,
        kind: CompletionItemKind.Snippet,
        documentation: snippets[key].description,
        // data: {
        //   range,
        //   textResult
        // }
        data: idx + 1
      };
    });
    
  } catch (error) {
    connection.console.log(`ERR: ${error}`);
  }

  return [];
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});


documents.listen(connection);

connection.listen();
