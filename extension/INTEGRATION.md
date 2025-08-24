# Synthora Kiro Extension Integration

This document describes how the Synthora Kiro extension integrates with the Next.js application and provides code archaeology features within the IDE.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kiro IDE                                 │
├─────────────────────────────────────────────────────────────────┤
│  Extension Host                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                Synthora Extension                           ││
│  │                                                             ││
│  │  Commands:           Panels:            Services:           ││
│  │  • AnalyzeFile      • StoryPanel        • WorkspaceManager ││
│  │  • ShowTimeline     • TimelinePanel     • ApiClient        ││
│  │  │  ShowHotspots    • HotspotsPanel                        ││
│  │  • AnalyzeRepo                                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP API Calls
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Application                          │
├─────────────────────────────────────────────────────────────────┤
│  API Routes:                                                    │
│  • /api/repositories                                            │
│  • /api/repositories/[id]/analyze                               │
│  • /api/repositories/[id]/files/[path]/story                    │
│  • /api/repositories/[id]/timeline                              │
│  • /api/repositories/[id]/hotspots                              │
│  • /api/health                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Communication Protocol

The extension communicates with the Next.js application through HTTP REST API calls:

### 1. Health Check
```typescript
GET /api/health
Response: { status: 'ok' }
```

### 2. Repository Management
```typescript
GET /api/repositories
POST /api/repositories { name: string, path: string }
Response: Repository
```

### 3. File Analysis
```typescript
GET /api/repositories/{id}/files/{path}/story
Response: FileStory

GET /api/repositories/{id}/files/{path}/metrics
Response: FileMetrics
```

### 4. Timeline and Hotspots
```typescript
GET /api/repositories/{id}/timeline
Response: Commit[]

GET /api/repositories/{id}/hotspots
Response: FileMetrics[]
```

## User Workflows

### 1. File Story Analysis
1. User right-clicks on file in explorer or editor
2. Selects "Tell me this file's story" from context menu
3. Extension detects workspace and repository
4. Extension calls API to get/create repository record
5. Extension requests file story from API
6. Story panel opens with AI-generated narrative

### 2. Repository Timeline
1. User runs "Show Repository Timeline" command
2. Extension detects current repository
3. Extension fetches commit history from API
4. Timeline panel displays interactive commit visualization

### 3. Code Hotspots
1. User runs "Show Code Hotspots" command
2. Extension fetches risk analysis from API
3. Hotspots panel displays files sorted by risk score
4. User can click to analyze specific files

## Extension Components

### Commands
- **AnalyzeFileCommand**: Handles file story generation requests
- **ShowTimelineCommand**: Opens repository timeline view
- **ShowHotspotsCommand**: Opens code hotspots view
- **AnalyzeRepositoryCommand**: Triggers full repository analysis

### Panels (Webviews)
- **StoryPanel**: Displays AI-generated file stories with formatting
- **TimelinePanel**: Shows commit timeline with interactive elements
- **HotspotsPanel**: Displays risk analysis with sortable metrics

### Services
- **WorkspaceManager**: Handles Git repository detection and file path management
- **ApiClient**: Manages HTTP communication with Next.js API

## Error Handling

The extension implements comprehensive error handling:

1. **API Unavailable**: Shows user-friendly message to start Next.js app
2. **No Repository**: Detects when workspace lacks Git repository
3. **File Not Found**: Handles missing or invalid file paths
4. **Network Errors**: Graceful degradation with retry mechanisms
5. **Permission Errors**: Clear messages for access issues

## Testing Strategy

### Unit Tests
- Service layer functionality (WorkspaceManager, ApiClient)
- Command execution logic
- Panel message handling

### Integration Tests
- End-to-end command workflows
- API communication scenarios
- Error handling paths

### Manual Testing
- Context menu integration
- Panel rendering and interaction
- Multi-repository workspace handling

## Development Setup

1. **Install Dependencies**:
   ```bash
   cd extension
   npm install
   ```

2. **Build Extension**:
   ```bash
   npm run build
   ```

3. **Run Tests**:
   ```bash
   npm run test
   ```

4. **Development Mode**:
   ```bash
   npm run dev  # Watches for changes
   ```

## Deployment

1. Build the extension: `npm run build`
2. Package for distribution (follow Kiro extension packaging)
3. Install in Kiro IDE
4. Ensure Next.js application is accessible

## Configuration

The extension automatically configures itself based on:
- Workspace Git repositories
- API endpoint (defaults to http://localhost:3000)
- File system permissions

No manual configuration is required for typical usage.

## Troubleshooting

### Common Issues

1. **"API not available"**
   - Start Next.js application: `npm run dev`
   - Check port 3000 is not blocked

2. **"No repository found"**
   - Ensure workspace contains `.git` directory
   - Check Git repository is properly initialized

3. **Extension not loading**
   - Verify Kiro IDE version compatibility
   - Check extension installation
   - Review IDE logs for errors

### Debug Mode

Enable debug logging by setting environment variable:
```bash
SYNTHORA_DEBUG=true
```

This will output detailed logs for troubleshooting extension behavior.

## Future Enhancements

Planned improvements for the extension:

1. **Offline Mode**: Cache analysis results for offline access
2. **Custom Prompts**: Allow users to customize AI story generation
3. **Team Insights**: Add collaboration pattern visualization
4. **Performance**: Optimize for large repositories
5. **Themes**: Support for custom visual themes