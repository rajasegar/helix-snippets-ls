#!/usr/bin/env node


import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  InsertTextFormat,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocumentIdentifier,
  TextDocuments,
  TextDocumentSyncKind

} from "vscode-languageserver/node";

console.log(`Inside lsp: ${new Date().toTimeString()}`);

    const snippets = [
      {
        "prefix": "ts",
        "expansion": "TypeScript"
      },
      {
        "prefix": "js",
        "expansion": "JavaScript"
      },
      {
        "prefix": "dt",
        "expansion": new Date().toDateString()
      },
      {
        "prefix": "info",
        "expansion": "information"
      }
    ];

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


  const triggerCharacters = snippets.map(s => s.prefix);

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

    return snippets.map((s,idx) => {
      return {
        label: s.expansion,
        kind: CompletionItemKind.Text,
        data: idx + 1
      };
    });

      /*

    return [
        {
            label: 'TypeScript',
            kind: CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'JavaScript',
            kind: CompletionItemKind.Text,
            data: 2
        }
    ]
    */

    /*
    const left = 0;
    const right = line.length;
    const abbreviation = "fc-ai";

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

    const textResult = "<AppInbox abc=\"$1\" xyz=\"$2\">$0</AppInbox>"
    return [
      {
        insertTextFormat: InsertTextFormat.Snippet,
        label: abbreviation,
        detail: abbreviation,
        documentation: textResult,
        textEdit: {
          range,
          newText: textResult,
          // newText: textResult.replace(/\$\{\d*\}/g,''),
        },
        kind: CompletionItemKind.Snippet,
        data: {
          range,
          textResult,
        },
      },
    ];
    */
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
