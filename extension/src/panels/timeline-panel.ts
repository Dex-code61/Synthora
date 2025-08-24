import * as kiro from 'kiro'
import { BasePanel } from './base-panel'
import { ApiClient, Commit, Repository } from '../services/api-client'

export class TimelinePanel extends BasePanel {
  private currentTimeline: Commit[] = []
  private currentRepository: Repository | null = null

  constructor(context: kiro.ExtensionContext, apiClient: ApiClient) {
    super(context, apiClient, 'synthora.timeline', 'Repository Timeline')
  }

  async show(timeline: Commit[], repository: Repository): Promise<void> {
    this.currentTimeline = timeline
    this.currentRepository = repository

    if (!this.panel) {
      this.panel = this.createPanel()
    }

    this.panel.title = `Timeline: ${repository.name}`
    this.updateContent()
    this.panel.reveal(kiro.ViewColumn.Two)
  }

  protected handleMessage(message: any): void {
    switch (message.type) {
      case 'refresh':
        this.refreshTimeline()
        break
      case 'openCommit':
        this.openCommit(message.data.sha)
        break
      case 'filterByAuthor':
        this.filterByAuthor(message.data.author)
        break
    }
  }

  private async refreshTimeline(): Promise<void> {
    if (!this.currentRepository) {
      return
    }

    try {
      this.postMessage({ type: 'loading', data: true })
      
      const updatedTimeline = await this.apiClient.getTimeline(this.currentRepository.id)
      this.currentTimeline = updatedTimeline
      this.updateContent()
      this.postMessage({ type: 'loading', data: false })
      
    } catch (error) {
      console.error('Error refreshing timeline:', error)
      this.postMessage({ 
        type: 'error', 
        data: `Failed to refresh timeline: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  private async openCommit(sha: string): Promise<void> {
    try {
      // This would ideally open the commit in a Git viewer
      // For now, we'll just show an info message
      kiro.window.showInformationMessage(`Commit: ${sha}`)
    } catch (error) {
      console.error('Error opening commit:', error)
    }
  }

  private filterByAuthor(author: string): void {
    // This would filter the timeline by author
    // For now, we'll just show an info message
    kiro.window.showInformationMessage(`Filter by author: ${author}`)
  }

  protected getHtmlContent(): string {
    if (!this.currentRepository) {
      return this.getBaseHtml(
        `
        <div class="header">
            <h1>Repository Timeline</h1>
        </div>
        <div class="loading">
            No timeline loaded
        </div>
        `,
        'Repository Timeline'
      )
    }

    const timelineHtml = this.currentTimeline
      .slice(0, 50) // Limit to first 50 commits for performance
      .map(commit => this.renderCommit(commit))
      .join('')

    const totalCommits = this.currentTimeline.length
    const showingCount = Math.min(50, totalCommits)

    return this.getBaseHtml(
      `
      <div class="header">
          <h1>Timeline: ${this.currentRepository.name}</h1>
          <div class="metadata">
              Showing ${showingCount} of ${totalCommits} commits
              <button class="button" onclick="sendMessage('refresh')">Refresh</button>
          </div>
      </div>
      
      <div class="timeline">
          ${timelineHtml}
      </div>
      
      ${showingCount < totalCommits ? `
      <div class="card">
          <p>Showing first ${showingCount} commits. Use the web dashboard for full timeline exploration.</p>
      </div>
      ` : ''}
      
      <script>
          function handleMessage(message) {
              switch (message.type) {
                  case 'loading':
                      if (message.data) {
                          document.querySelector('.timeline').innerHTML = '<div class="loading">Refreshing timeline...</div>';
                      }
                      break;
                  case 'error':
                      document.querySelector('.timeline').innerHTML = '<div class="error">' + message.data + '</div>';
                      break;
              }
          }
          
          function openCommit(sha) {
              sendMessage('openCommit', { sha });
          }
          
          function filterByAuthor(author) {
              sendMessage('filterByAuthor', { author });
          }
      </script>
      `,
      `Timeline: ${this.currentRepository.name}`
    )
  }

  private renderCommit(commit: Commit): string {
    const date = new Date(commit.timestamp).toLocaleString()
    const shortSha = commit.sha.substring(0, 8)
    
    return `
      <div class="timeline-item">
          <div class="timeline-date">${date}</div>
          <div class="timeline-message">
              <strong onclick="openCommit('${commit.sha}')" style="cursor: pointer; color: var(--kiro-textLink-foreground);">
                  ${shortSha}
              </strong>
              ${this.escapeHtml(commit.message)}
          </div>
          <div class="timeline-author">
              by <span onclick="filterByAuthor('${this.escapeHtml(commit.author)}')" style="cursor: pointer; color: var(--kiro-textLink-foreground);">
                  ${this.escapeHtml(commit.author)}
              </span>
              • ${commit.filesChanged} files • +${commit.insertions} -${commit.deletions}
          </div>
      </div>
    `
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}