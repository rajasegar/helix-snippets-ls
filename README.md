# helix snippets ls
Language server for snippets in Helix

This package allows you to add snippets to the [Helix](https://helix-editor.com) editor
using a LSP server for autocompleting snippets.

You can define your snippets in a TOML file and use it in Helix.

![helix snippets demo](helix-snippets-ls.gif)


## Install
```
npm i -g helix-snippets-ls
```


### Usage
Create an `snippets.toml` file inside your Helix config dir `~/.config/helix/snippets.toml`

Add snippets inside it like:

```toml
hx = "Helix"
lsp = "Language Server Protocol"
cfg = "config"
js = "JavaScript"
ts = "TypeScript"
```

### Config
Config your `languages.toml` to use this Language server

```toml
[[language]]
name = "handlebars"
roots = ["package.json"]
file-types = ["hbs"]
scope = "source.hbs"
language-server = { command = "helix-snippets-ls" } 
```

### Known limitations
- The language server can be only used for one language at a time
