import * as kiro from 'kiro'
import { BasePanel } from './base-panel'
import { ApiClient, FileStory } from '../services/api-client'

export class StoryPanel extends BasePanel {
  private currentStory: FileStory | null = null
  private currentFilePath: string | null = null

  constructor(context: kiro.ExtensionContext, apiClient: ApiClient) {
    super(context, apiClient, 'synthora.story', 'File Story')
  }

  async show(story: FileStory, filePath: string): Promise<void> {
    this.currentStory = story
    this.currentFilePath = filePath

    if (!this.panel) {
      this.panel = this.createPanel()
    }

    this.panel.title = `Story: ${filePath}`
    this.updateContent()
    this.panel.reveal(kiro.ViewColumn.Two)
  }

  protected handleMessage(message: any): void {
    switch (message.type) {
      case 'refresh':
        this.refreshStory()
        break
      case 'openFile':
        this.openFile(message.data.filePath)
        break
    }
  }

  private async refreshStory(): Promise<void> {
    if (!this.currentStory || !this.currentFilePath) {
      return
    }

    try {
      this.postMessage({ type: 'loading', data: true })
      
      // Re-fetch the story
      const updatedStory = await this.apiClient.getFileStory(
        this.currentStory.repositoryId,
        this.currentFilePath
      )
      
      this.currentStory = updatedStory
      this.updateContent()
      this.postMessage({ type: 'loading', data: false })
      
    } catch (error) {
      console.error('Error refreshing story:', error)
      this.postMessage({ 
        type: 'error', 
        data: `Failed to refresh story: ${error instanceof Error ? error.message : 'Unknown error'}` 
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

  protected getHtmlContent(): string {
    if (!this.currentStory || !this.currentFilePath) {
      return this.getBaseHtml(
        `
        <div class="header">
            <h1>File Story</h1>
        </div>
        <div class="loading">
            No story loaded
        </div>
        `,
        'File Story'
      )
    }

    const storyDate = new Date(this.currentStory.generatedAt).toLocaleString()
    
    return this.getBaseHtml(
      `
      <div class="header">
          <h1>File Story: ${this.currentFilePath}</h1>
          <div class="metadata">
              Generated on ${storyDate}
              <button class="button" onclick="sendMessage('refresh')">Refresh</button>
          </div>
      </div>
      
      <div class="card">
          <div class="content">${this.formatStoryContent(this.currentStory.storyContent)}</div>
      </div>
      
      <script>
          function handleMessage(message) {
              switch (message.type) {
                  case 'loading':
                      if (message.data) {
                          document.querySelector('.content').innerHTML = '<div class="loading">Refreshing story...</div>';
                      }
                      break;
                  case 'error':
                      document.querySelector('.content').innerHTML = '<div class="error">' + message.data + '</div>';
                      break;
              }
          }
      </script>
      `,
      `Story: ${this.currentFilePath}`
    )
  }

  private formatStoryContent(content: string): string {
    // Basic formatting for the story content
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  }
}