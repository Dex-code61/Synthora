import * as kiro from 'kiro'
import { WorkspaceManager } from '../services/workspace-manager'
import { ApiClient } from '../services/api-client'

export class AnalyzeRepositoryCommand {
  constructor(
    private workspaceManager: WorkspaceManager,
    private apiClient: ApiClient
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

      // Get or create repository
      const repositoryName = this.workspaceManager.getRepositoryName(repositoryPath)
      const repository = await this.apiClient.getOrCreateRepository(repositoryName, repositoryPath)

      // Show confirmation dialog
      const choice = await kiro.window.showInformationMessage(
        `Analyze repository "${repositoryName}"? This may take several minutes for large repositories.`,
        'Analyze',
        'Cancel'
      )

      if (choice !== 'Analyze') {
        return
      }

      // Start analysis
      kiro.window.showInformationMessage('Starting repository analysis...')
      const job = await this.apiClient.analyzeRepository(repository.id)

      // Poll for completion
      await this.pollAnalysisStatus(job.id)

    } catch (error) {
      console.error('Error analyzing repository:', error)
      kiro.window.showErrorMessage(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async pollAnalysisStatus(jobId: string): Promise<void> {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    const poll = async (): Promise<void> => {
      try {
        const status = await this.apiClient.getAnalysisStatus(jobId)
        
        switch (status.status) {
          case 'completed':
            kiro.window.showInformationMessage('Repository analysis completed successfully!')
            return
          
          case 'failed':
            kiro.window.showErrorMessage(`Repository analysis failed: ${status.message || 'Unknown error'}`)
            return
          
          case 'processing':
            const progressMessage = status.progress 
              ? `Repository analysis in progress... ${Math.round(status.progress)}%`
              : 'Repository analysis in progress...'
            
            console.log(progressMessage)
            break
          
          case 'pending':
            console.log('Repository analysis is queued...')
            break
        }

        attempts++
        if (attempts >= maxAttempts) {
          kiro.window.showWarningMessage('Repository analysis is taking longer than expected. Check the Synthora dashboard for status.')
          return
        }

        // Continue polling
        setTimeout(poll, 5000)
        
      } catch (error) {
        console.error('Error polling analysis status:', error)
        kiro.window.showErrorMessage('Failed to check analysis status')
      }
    }

    await poll()
  }
}