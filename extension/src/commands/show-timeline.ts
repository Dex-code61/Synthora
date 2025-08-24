import * as kiro from 'kiro'
import { WorkspaceManager } from '../services/workspace-manager'
import { ApiClient } from '../services/api-client'
import { TimelinePanel } from '../panels/timeline-panel'

export class ShowTimelineCommand {
  constructor(
    private workspaceManager: WorkspaceManager,
    private apiClient: ApiClient,
    private timelinePanel: TimelinePanel
  ) {}

  async execute(): Promise<void> {
    try {
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

      // Show progress
      kiro.window.showInformationMessage('Loading repository timeline...')

      // Get or create repository
      const repositoryName = this.workspaceManager.getRepositoryName(repositoryPath)
      const repository = await this.apiClient.getOrCreateRepository(repositoryName, repositoryPath)

      // Get timeline data
      const timeline = await this.apiClient.getTimeline(repository.id)

      // Show timeline in panel
      await this.timelinePanel.show(timeline, repository)

      kiro.window.showInformationMessage('Timeline loaded successfully!')

    } catch (error) {
      console.error('Error showing timeline:', error)
      kiro.window.showErrorMessage(`Failed to load timeline: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}