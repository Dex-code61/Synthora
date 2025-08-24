import * as kiro from 'kiro'
import { WorkspaceManager } from '../services/workspace-manager'
import { ApiClient } from '../services/api-client'
import { StoryPanel } from '../panels/story-panel'


export class AnalyzeFileCommand {
  constructor(
    private workspaceManager: WorkspaceManager,
    private apiClient: ApiClient,
    private storyPanel: StoryPanel
  ) {}

  async execute(uri?: kiro.Uri): Promise<void> {
    try {
      // Get file path from URI or active editor
      let filePath: string | null = null
      
      if (uri) {
        filePath = uri.fsPath
      } else {
        filePath = this.workspaceManager.getCurrentFilePath()
      }

      if (!filePath) {
        kiro.window.showErrorMessage('No file selected or active')
        return
      }

      // Check if file is in workspace
      if (!this.workspaceManager.isFileInWorkspace(filePath)) {
        kiro.window.showErrorMessage('File is not in the current workspace')
        return
      }

      // Get repository path
      const repositoryPath = await this.workspaceManager.getRepositoryPath()
      if (!repositoryPath) {
        kiro.window.showErrorMessage('No Git repository found in workspace')
        return
      }

      // Check API health
      const isApiHealthy = await this.apiClient.checkHealth()
      if (!isApiHealthy) {
        kiro.window.showErrorMessage('Synthora API is not available. Please ensure the Next.js application is running.')
        return
      }

      // Get relative file path
      const relativeFilePath = this.workspaceManager.getRelativeFilePath(filePath)
      if (!relativeFilePath) {
        kiro.window.showErrorMessage('Could not determine relative file path')
        return
      }

      // Show progress
      kiro.window.showInformationMessage('Analyzing file story...')

      // Get or create repository
      const repositoryName = this.workspaceManager.getRepositoryName(repositoryPath)
      const repository = await this.apiClient.getOrCreateRepository(repositoryName, repositoryPath)

      // Get file story
      const fileStory = await this.apiClient.getFileStory(repository.id, relativeFilePath)

      // Show story in panel
      await this.storyPanel.show(fileStory, relativeFilePath)

      kiro.window.showInformationMessage('File story generated successfully!')

    } catch (error) {
      console.error('Error analyzing file:', error)
      kiro.window.showErrorMessage(`Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}