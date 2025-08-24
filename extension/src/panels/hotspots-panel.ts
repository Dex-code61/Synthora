import * as kiro from 'kiro'
import { BasePanel } from './base-panel'
import { ApiClient, FileMetrics, Repository } from '../services/api-client'

export class HotspotsPanel extends BasePanel {
  private currentHotspots: FileMetrics[] = []
  private currentRepository: Repository | null = null

  constructor(context: kiro.ExtensionContext, apiClient: ApiClient) {
    super(context, apiClient, 'synthora.hotspots', 'Code Hotspots')
  }

  async show(hotspots: FileMetrics[], repository: Repository): Promise<void> {
    this.currentHotspots = hotspots
    this.currentRepository = repository

    if (!this.panel) {
      this.panel = this.createPanel()
    }

    this.panel.title = `Hotspots: ${repository.name}`
    this.updateContent()
    this.panel.reveal(kiro.ViewColumn.Two)
  }

  protected handleMessage(message: any): void {
    switch (message.type) {
      case 'refresh':
        this.refreshHotspots()
        break
      case 'openFile':
        this.openFile(message.data.filePath)
        break
      case 'analyzeFile':
        this.analyzeFile(message.data.filePath)
        break
    }
  }

  private async refreshHotspots(): Promise<void> {
    if (!this.currentRepository) {
      return
    }

    try {
      this.postMessage({ type: 'loading', data: true })
      
      const updatedHotspots = await this.apiClient.getHotspots(this.currentRepository.id)
      this.currentHotspots = updatedHotspots
      this.updateContent()
      this.postMessage({ type: 'loading', data: false })
      
    } catch (error) {
      console.error('Error refreshing hotspots:', error)
      this.postMessage({ 
        type: 'error', 
        data: `Failed to refresh hotspots: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  private async openFile(filePath: string): Promise<void> {
    try {
      const workspaceFolders = kiro.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return
      }

      const fullPath = `${workspaceFolders[0].uri.fsPath}/${filePath}`
      const uri = kiro.Uri.file(fullPath)
      
      await kiro.commands.executeCommand('kiro.open', uri)
    } catch (error) {
      console.error('Error opening file:', error)
    }
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      await kiro.commands.executeCommand('synthora.analyzeFile', { fsPath: filePath })
    } catch (error) {
      console.error('Error analyzing file:', error)
    }
  }

  protected getHtmlContent(): string {
    if (!this.currentRepository) {
      return this.getBaseHtml(
        `
        <div class="header">
            <h1>Code Hotspots</h1>
        </div>
        <div class="loading">
            No hotspots loaded
        </div>
        `,
        'Code Hotspots'
      )
    }

    // Sort hotspots by risk score (highest first)
    const sortedHotspots = [...this.currentHotspots].sort((a, b) => b.riskScore - a.riskScore)
    
    const hotspotsHtml = sortedHotspots
      .slice(0, 20) // Limit to top 20 for performance
      .map(hotspot => this.renderHotspot(hotspot))
      .join('')

    const totalHotspots = this.currentHotspots.length
    const showingCount = Math.min(20, totalHotspots)

    return this.getBaseHtml(
      `
      <div class="header">
          <h1>Hotspots: ${this.currentRepository.name}</h1>
          <div class="metadata">
              Showing top ${showingCount} of ${totalHotspots} files by risk score
              <button class="button" onclick="sendMessage('refresh')">Refresh</button>
          </div>
      </div>
      
      <div class="hotspots">
          ${hotspotsHtml}
      </div>
      
      ${showingCount < totalHotspots ? `
      <div class="card">
          <p>Showing top ${showingCount} files. Use the web dashboard for complete analysis.</p>
      </div>
      ` : ''}
      
      <script>
          function handleMessage(message) {
              switch (message.type) {
                  case 'loading':
                      if (message.data) {
                          document.querySelector('.hotspots').innerHTML = '<div class="loading">Refreshing hotspots...</div>';
                      }
                      break;
                  case 'error':
                      document.querySelector('.hotspots').innerHTML = '<div class="error">' + message.data + '</div>';
                      break;
              }
          }
          
          function openFile(filePath) {
              sendMessage('openFile', { filePath });
          }
          
          function analyzeFile(filePath) {
              sendMessage('analyzeFile', { filePath });
          }
      </script>
      `,
      `Hotspots: ${this.currentRepository.name}`
    )
  }

  private renderHotspot(hotspot: FileMetrics): string {
    const riskClass = this.getRiskClass(hotspot.riskScore)
    const riskLabel = this.getRiskLabel(hotspot.riskScore)
    const lastModified = new Date(hotspot.lastModified).toLocaleDateString()
    
    return `
      <div class="card">
          <h3>
              <span onclick="openFile('${this.escapeHtml(hotspot.filePath)}')" 
                    style="cursor: pointer; color: var(--kiro-textLink-foreground);">
                  ${this.escapeHtml(hotspot.filePath)}
              </span>
              <span class="${riskClass}" style="float: right;">
                  ${riskLabel} (${(hotspot.riskScore * 100).toFixed(1)}%)
              </span>
          </h3>
          
          <div class="metrics-grid">
              <div class="metric-item">
                  <div class="metric-value">${hotspot.commitCount}</div>
                  <div class="metric-label">Commits</div>
              </div>
              <div class="metric-item">
                  <div class="metric-value">${hotspot.authorCount}</div>
                  <div class="metric-label">Authors</div>
              </div>
              <div class="metric-item">
                  <div class="metric-value">${hotspot.totalChanges}</div>
                  <div class="metric-label">Changes</div>
              </div>
              <div class="metric-item">
                  <div class="metric-value">${hotspot.bugCommits}</div>
                  <div class="metric-label">Bug Fixes</div>
              </div>
          </div>
          
          <div class="metadata">
              Last modified: ${lastModified}
              ${hotspot.authors.length > 0 ? `• Authors: ${hotspot.authors.slice(0, 3).join(', ')}${hotspot.authors.length > 3 ? '...' : ''}` : ''}
          </div>
          
          <div style="margin-top: 10px;">
              <button class="button" onclick="analyzeFile('${this.escapeHtml(hotspot.filePath)}')">
                  Tell me this file's story
              </button>
          </div>
      </div>
    `
  }

  private getRiskClass(riskScore: number): string {
    if (riskScore >= 0.8) return 'risk-high'
    if (riskScore >= 0.5) return 'risk-medium'
    return 'risk-low'
  }

  private getRiskLabel(riskScore: number): string {
    if (riskScore >= 0.8) return 'HIGH RISK'
    if (riskScore >= 0.5) return 'MEDIUM RISK'
    return 'LOW RISK'
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}