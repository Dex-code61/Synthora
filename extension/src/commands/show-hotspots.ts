import * as kiro from 'kiro'
import { WorkspaceManager } from '../services/workspace-manager'
import { ApiClient } from '../services/api-client'
import { HotspotsPanel } from '../panels/hotspots-panel'

export class ShowHotspotsCommand {
  constructor(
    private workspaceManager: WorkspaceManager,
    private apiClient: ApiClient,
    private hotspotsPanel: HotspotsPanel
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
      kiro.window.showInformationMessage('Loading code hotspots...')

      // Get or create repository
      const repositoryName = this.workspaceManager.getRepositoryName(repositoryPath)
      const repository = await this.apiClient.getOrCreateRepository(repositoryName, repositoryPath)

      // Get hotspots data
      const hotspots = await this.apiClient.getHotspots(repository.id)

      // Show hotspots in panel
      await this.hotspotsPanel.show(hotspots, repository)

      kiro.window.showInformationMessage('Code hotspots loaded successfully!')

    } catch (error) {
      console.error('Error showing hotspots:', error)
      kiro.window.showErrorMessage(`Failed to load hotspots: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}