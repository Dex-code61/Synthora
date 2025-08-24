import * as kiro from "kiro";
import { WorkspaceManager } from "./services/workspace-manager";
import { ApiClient } from "./services/api-client";
import { TimelinePanel } from "./panels/timeline-panel";
import { StoryPanel } from "./panels/story-panel";
import { HotspotsPanel } from "./panels/hotspots-panel";
import { AnalyzeFileCommand } from "./commands/analyze-file";
import { ShowTimelineCommand } from "./commands/show-timeline";
import { ShowHotspotsCommand } from "./commands/show-hotspots";
import { AnalyzeRepositoryCommand } from "./commands/analyze-repository";

let workspaceManager: WorkspaceManager;
let apiClient: ApiClient;

export function activate(context: kiro.ExtensionContext) {
  console.log("Synthora extension is now active!");

  // Initialize services
  workspaceManager = new WorkspaceManager();
  apiClient = new ApiClient();

  // Initialize panels
  const timelinePanel = new TimelinePanel(context, apiClient);
  const storyPanel = new StoryPanel(context, apiClient);
  const hotspotsPanel = new HotspotsPanel(context, apiClient);

  // Register commands
  const analyzeFileCommand = new AnalyzeFileCommand(
    workspaceManager,
    apiClient,
    storyPanel
  );
  const showTimelineCommand = new ShowTimelineCommand(
    workspaceManager,
    apiClient,
    timelinePanel
  );
  const showHotspotsCommand = new ShowHotspotsCommand(
    workspaceManager,
    apiClient,
    hotspotsPanel
  );
  const analyzeRepositoryCommand = new AnalyzeRepositoryCommand(
    workspaceManager,
    apiClient
  );

  // Register command handlers
  context.subscriptions.push(
    kiro.commands.registerCommand(
      "synthora.analyzeFile",
      analyzeFileCommand.execute.bind(analyzeFileCommand)
    ),
    kiro.commands.registerCommand(
      "synthora.showTimeline",
      showTimelineCommand.execute.bind(showTimelineCommand)
    ),
    kiro.commands.registerCommand(
      "synthora.showHotspots",
      showHotspotsCommand.execute.bind(showHotspotsCommand)
    ),
    kiro.commands.registerCommand(
      "synthora.analyzeRepository",
      analyzeRepositoryCommand.execute.bind(analyzeRepositoryCommand)
    )
  );

  // Set context for when repository is available
  updateRepositoryContext();

  // Listen for workspace changes
  kiro.workspace.onDidChangeWorkspaceFolders(() => {
    updateRepositoryContext();
  });

  console.log("Synthora extension commands registered successfully");
}

export function deactivate() {
  console.log("Synthora extension is now deactivated");
}

async function updateRepositoryContext() {
  const hasRepository = await workspaceManager.hasGitRepository();
  kiro.commands.executeCommand(
    "setContext",
    "synthora.hasRepository",
    hasRepository
  );
}
