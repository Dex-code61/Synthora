# Synthora Kiro Extension

This is the Kiro IDE extension for Synthora, providing AI-powered Git repository analysis and code evolution insights directly within your development environment.

## Features

- **File Story Analysis**: Right-click on any file to get an AI-generated story about its evolution
- **Repository Timeline**: Interactive visualization of commit history
- **Code Hotspots**: Identify high-risk files that need attention
- **Seamless Integration**: Works directly within Kiro IDE workflow

## Commands

- `Synthora: Tell me this file's story` - Analyze the current file's evolution
- `Synthora: Show Repository Timeline` - Display interactive commit timeline
- `Synthora: Show Code Hotspots` - Show risk analysis for all files
- `Synthora: Analyze Repository` - Start full repository analysis

## Requirements

- Kiro IDE
- Git repository in workspace
- Synthora Next.js application running (default: http://localhost:3000)

## Installation

1. Build the extension:
   ```bash
   cd extension
   npm install
   npm run build
   ```

2. Install in Kiro IDE (follow Kiro extension installation process)

3. Ensure the Synthora Next.js application is running

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Testing with UI

```bash
npm run test:ui
```

## Architecture

The extension consists of several key components:

### Services
- **WorkspaceManager**: Handles workspace and Git repository detection
- **ApiClient**: Communicates with the Synthora Next.js API

### Commands
- **AnalyzeFileCommand**: Handles file story generation
- **ShowTimelineCommand**: Displays repository timeline
- **ShowHotspotsCommand**: Shows code hotspots
- **AnalyzeRepositoryCommand**: Triggers repository analysis

### Panels
- **StoryPanel**: Displays AI-generated file stories
- **TimelinePanel**: Shows interactive commit timeline
- **HotspotsPanel**: Displays risk analysis and hotspots

## Configuration

The extension automatically detects:
- Git repositories in the workspace
- Synthora API endpoint (defaults to http://localhost:3000)

## Troubleshooting

### "Synthora API is not available"
- Ensure the Synthora Next.js application is running
- Check that the API is accessible at http://localhost:3000
- Verify network connectivity

### "No Git repository found"
- Ensure your workspace contains a Git repository
- Check that the .git directory exists

### Extension not loading
- Verify Kiro IDE version compatibility
- Check extension installation
- Review Kiro IDE logs for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.