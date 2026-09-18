# CedarLeaf

CedarLeaf is a lightweight desktop tree-structure note-taking application built with Electron + Vue3 + TipTap. All notes are stored locally in Markdown format, ensuring your data remains open, portable, and never locked into a proprietary format.

## Features

- **Tree Structure**: Unlimited hierarchical nodes with drag-and-drop sorting, copy/paste, and bookmarks
- **Markdown Storage**: All notes saved as local `.md` files - openable in any text editor, version-controllable with Git
- **Rich Editor**: WYSIWYG editing with images, tables, and code blocks (all resizable via drag)
- **Screenshot Annotation**: Built-in screenshot tool with rectangle, ellipse, arrow, pen, text, numbering, and mosaic annotations. Annotations can be moved after placement.
- **Long Screenshot**: Scroll capture and auto-stitch full-page screenshots
- **Text Properties**: Font size slider (8-72px) with 8 preset colors and custom color picker
- **Clipboard Integration**: Screenshots automatically copied to clipboard for easy pasting
- **Privacy First**: All data stored locally, no registration required, no cloud sync
- **Auto-save**: Configurable auto-save interval (default 2 minutes)

## File Storage Format

CedarLeaf stores all notes in a single Markdown file (default: `cedarleaf.md`), using HTML comments as metadata markers:

\`\`\`
<!-- CedarLeaf Document -->
<!-- lt:bookmarks [1,3] -->

<!-- lt:node {"id":1,"parent":0,"name":"My Notebook","icon":"📔"} -->
# My Notebook
Note content here...

<!-- lt:node {"id":2,"parent":1,"name":"Sub Node","icon":"📄"} -->
## Sub Node
Sub node content...
\`\`\`

This format ensures your data is always readable as plain text.

## Download

- **Installer**: [CedarLeaf.Setup.1.1.9.exe](https://github.com/cornelius150/Xm-CedarLeaf/releases/download/v2.1.0/CedarLeaf.Setup.1.1.9.exe) (~88 MB)
- **Portable**: [CedarLeaf.1.1.9.exe](https://github.com/cornelius150/Xm-CedarLeaf/releases/download/v2.1.0/CedarLeaf.1.1.9.exe) (~87 MB)

## Tech Stack

- Electron 32 - Cross-platform desktop framework
- Vue 3 - Frontend UI
- TipTap - WYSIWYG editor
- sql.js - In-memory database (runtime)
- Markdown file - Data persistence

## License

MIT

## Links

- **Official Website**: https://cornelius150.github.io/Xm-CedarLeaf/
- **Online Manual**: https://cornelius150.github.io/Xm-CedarLeaf/docs.html
- **Donate**: https://cornelius150.github.io/Xm-CedarLeaf/donate.html
- **Bug Report**: https://github.com/cornelius150/Xm-CedarLeaf/issues
