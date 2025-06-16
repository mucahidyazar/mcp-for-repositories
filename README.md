# MCP Server for Repositories

A powerful Model Context Protocol (MCP) server that provides intelligent analysis and management capabilities for local code repositories. This server enables AI assistants to scan, analyze, and provide comprehensive documentation for all repositories in a specified directory.

## Features

- 🔍 **Repository Discovery**: Automatically scans and identifies all repositories in a directory
- 📋 **Comprehensive Analysis**: Provides detailed information about each repository including structure, dependencies, and metadata
- 🚀 **Easy Integration**: Seamlessly integrates with Claude Desktop and other MCP-compatible applications
- ⚡ **Fast Performance**: Built with Bun for optimal speed and efficiency
- 🛠️ **Configurable**: Flexible configuration options for different use cases

## Installation

### Prerequisites
- Node.js 18+ or Bun 1.0+
- Git (for repository analysis)

### Install Dependencies
```bash
bun install
```

### Build the Server
```bash
bun run build
```

## Configuration

### Environment Variables

Set the `REPOSITORIES_PATH` environment variable to specify the directory containing your repositories:

```bash
export REPOSITORIES_PATH="/Users/username/workspace/repositories"
```

If not set, it defaults to the parent directory of the server (`..`).

### Claude Desktop Integration

To use this MCP server with Claude Desktop, add the following configuration to your Claude Desktop settings:

#### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "globalShortcut": "Cmd+;",
  "mcpServers": {
    "mcp-for-repositories": {
      "command": "node",
      "args": ["/path/to/mcp-for-repositories/dist/index.js"],
      "env": {
        "REPOSITORIES_PATH": "/Users/username/workspace/repositories"
      }
    }
  }
}
```

#### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "globalShortcut": "Ctrl+;",
  "mcpServers": {
    "mcp-for-repositories": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-for-repositories\\dist\\index.js"],
      "env": {
        "REPOSITORIES_PATH": "C:\\Users\\username\\workspace\\repositories"
      }
    }
  }
}
```

#### Linux
Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "globalShortcut": "Ctrl+;",
  "mcpServers": {
    "mcp-for-repositories": {
      "command": "node",
      "args": ["/home/username/mcp-for-repositories/dist/index.js"],
      "env": {
        "REPOSITORIES_PATH": "/home/username/workspace/repositories"
      }
    }
  }
}
```

After adding the configuration, restart Claude Desktop for the changes to take effect.

## Usage

### Development Mode
```bash
bun run dev
```

### Production Mode
```bash
bun run start
```

### Using with Node.js
```bash
bun run start:node
```

### Manual Execution
```bash
# With environment variable
REPOSITORIES_PATH="/path/to/your/repositories" node ./dist/index.js

# Or set the variable separately
export REPOSITORIES_PATH="/path/to/your/repositories"
node ./dist/index.js
```

## Available Commands

Once integrated with Claude Desktop, you can use natural language to:

- List all repositories in the configured directory
- Get detailed information about specific repositories
- Analyze project structures and dependencies
- Search for files or patterns across repositories
- Get repository statistics and metadata

Example interactions:
- "Show me all repositories in my workspace"
- "What's the structure of the my-project repository?"
- "Find all TypeScript files in the react-app repository"
- "What dependencies does the backend-api project use?"

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the production bundle
- `npm run start` - Start the production server
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

### Project Structure
```
mcp-for-repositories/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Built output
├── package.json          # Project configuration
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **Server not appearing in Claude Desktop**
   - Ensure the path to the built server is correct
   - Check that Node.js is installed and accessible
   - Verify the JSON configuration syntax is valid
   - Restart Claude Desktop after configuration changes

2. **Repository path not found**
   - Verify the `REPOSITORIES_PATH` environment variable is set correctly
   - Ensure the specified directory exists and contains repositories
   - Check directory permissions

3. **Build errors**
   - Ensure all dependencies are installed: `bun install`
   - Check Node.js/Bun version compatibility
   - Clear build cache: `npm run clean && npm run build`

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

MIT License - see LICENSE file for details.

## Author

**Mucahid Yazar**
- Website: [mucahid.dev](https://mucahid.dev)
- GitHub: [@mucahidyazar](https://github.com/mucahidyazar)
- Email: mucahidyazar@gmail.com
