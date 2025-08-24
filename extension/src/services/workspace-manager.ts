import * as kiro from 'kiro'
import * as path from 'path'
import * as fs from 'fs'

export class WorkspaceManager {
  /**
   * Check if the current workspace has a Git repository
   */
  async hasGitRepository(): Promise<boolean> {
    const workspaceFolders = kiro.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return false
    }

    for (const folder of workspaceFolders) {
      const gitPath = path.join(folder.uri.fsPath, '.git')
      try {
        const stats = await fs.promises.stat(gitPath)
        if (stats.isDirectory() || stats.isFile()) {
          return true
        }
      } catch {
        // Continue checking other folders
      }
    }

    return false
  }

  /**
   * Get the path to the Git repository
   */
  async getRepositoryPath(): Promise<string | null> {
    const workspaceFolders = kiro.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null
    }

    for (const folder of workspaceFolders) {
      const gitPath = path.join(folder.uri.fsPath, '.git')
      try {
        const stats = await fs.promises.stat(gitPath)
        if (stats.isDirectory() || stats.isFile()) {
          return folder.uri.fsPath
        }
      } catch {
        // Continue checking other folders
      }
    }

    return null
  }

  /**
   * Get the relative path of a file within the repository
   */
  getRelativeFilePath(filePath: string): string | null {
    const workspaceFolders = kiro.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null
    }

    for (const folder of workspaceFolders) {
      if (filePath.startsWith(folder.uri.fsPath)) {
        return path.relative(folder.uri.fsPath, filePath)
      }
    }

    return null
  }

  /**
   * Get the current active file path
   */
  getCurrentFilePath(): string | null {
    const activeEditor = kiro.window.activeTextEditor
    if (!activeEditor) {
      return null
    }

    return activeEditor.document.uri.fsPath
  }

  /**
   * Get the workspace folder for a given file
   */
  getWorkspaceFolder(filePath: string): kiro.WorkspaceFolder | null {
    const workspaceFolders = kiro.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null
    }

    for (const folder of workspaceFolders) {
      if (filePath.startsWith(folder.uri.fsPath)) {
        return folder
      }
    }

    return null
  }

  /**
   * Check if a file is within the workspace
   */
  isFileInWorkspace(filePath: string): boolean {
    return this.getWorkspaceFolder(filePath) !== null
  }

  /**
   * Get repository name from path
   */
  getRepositoryName(repositoryPath: string): string {
    return path.basename(repositoryPath)
  }
}