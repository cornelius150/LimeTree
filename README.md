# LimeTree

LimeTree - Desktop tree-structure note-taking application inspired by CherryTree, myBase, and OneNote.

## Features

- **Tree Structure** - Hierarchical note organization with drag-and-drop reordering
- **Resizable Images** - Insert images and resize them by dragging corner handles
- **Resizable Tables** - Insert custom tables with drag-to-resize columns
- **Resizable Code Blocks** - Insert code blocks with drag-to-resize container
- **Node Timestamps** - Each node displays creation date/time
- **Markdown Storage** - Notes are saved in Markdown format
- **Full-Text Search** - Search across all nodes by name and content
- **Dark Mode** - Toggle between light and dark themes
- **Export** - Export notes to Markdown or HTML files
- **Image Paste** - Paste images directly from clipboard (Ctrl+V)
- **Custom Table Insert** - Specify rows, columns, and header row

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **Vue 3** - Frontend framework
- **TipTap** - Rich text editor (ProseMirror-based)
- **sql.js** - SQLite database (in-browser)
- **Vite** - Build tool

## Build

```bash
# Install dependencies
npm install

# Build Vue frontend
npm run build:vue

# Build Electron app (Windows installer)
npm run dist
```

## Download

Download the latest release from the [Releases page](../../releases).

- `LimeTree Setup 2.0.0.exe` - NSIS installer
- `LimeTree 2.0.0.exe` - Portable version

## License

MIT