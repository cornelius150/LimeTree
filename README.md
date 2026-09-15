# LimeTree

LimeTree is a desktop tree-structure note-taking application built with Electron + Vue3 + TipTap, with menu structure and functionality aligned to CherryTree (based on CherryTree source code `ct_menu_ui.cc` and `ct_menu_actions.cc`).

## Features

### Menu Structure (aligned with CherryTree source code)
- **File**: New Instance / Open File / Open Folder / Import (18 formats) / Export (PDF/HTML/TXT) / Save / Save As / Print / Preferences / Tree Info
- **Edit**: Undo/Redo / Cut/Copy/Paste / Row Operations (Duplicate/Delete/Move Up/Move Down) / Table Operations / CodeBox Operations
- **Insert**: Image / Table / CodeBox / Embedded File / Link / Anchor / TOC / Timestamp / Special Character / Horizontal Rule / Bullet List / Numbered List / Todo List
- **Format**: Clone Format / Remove Format / Text Color / Background Color / Bold/Italic/Underline/Strikethrough/Monospace/Small/Subscript/Superscript / Heading H1-H6 / Change Case / Indent/Unindent / Justify
- **Tools**: Spell Check / Execute Code / Strip Trailing Spaces / Replace Tabs / Command Palette
- **Tree**: Add Node / Add Subnode / Duplicate / Node Properties / Bookmarks / Expand All / Collapse All / Move Up/Down/Left/Right / Sort / Delete
- **Search**: Find in Node / Find in All Nodes / Find in Node Names / Find Next/Prev / Replace / Replace All
- **View**: Show/Hide Tree / Toolbar / Statusbar / Node Name Header / Fullscreen / Always on Top / Zoom In/Out
- **Bookmarks**: Add / Remove / Manage
- **Help**: Check Update / Homepage / GitHub / Issues / About

### Custom Enhancements
- **Resizable Images**: Drag corner handles to resize inserted images
- **Resizable Tables**: Drag column borders to resize table columns
- **Resizable Code Boxes**: Drag bottom-right corner to resize code box height
- **Node Timestamps**: Each node displays creation date/time
- **Markdown Storage**: Notes saved as `.md` files
- **Search Dialog**: Full search with options (case match, whole word, regex, time filter, scope)
- **Settings Dialog**: 12 categories matching CherryTree preferences
- **Dark Mode**: Toggle between light and dark themes

### Toolbar (CherryTree TOOLBAR_VEC_DEFAULT layout)
6 groups, 42 buttons: Add Node/Subnode | Back/Forward | Open/Save/Export | Search | Lists/Indent | Insert Elements | Format

## Tech Stack
- **Electron** - Cross-platform desktop framework
- **Vue 3** - Frontend framework
- **TipTap** - Rich text editor (ProseMirror-based)
- **sql.js** - SQLite database (in-browser)
- **tiptap-markdown** - Markdown storage support
- **Vite** - Build tool

## Build

```bash
npm install
npm run build:vue
npm run dist
```

## Download

Download from [Releases](../../releases).

## License

MIT