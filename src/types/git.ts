export interface Commit {
  sha: string
  author: string
  email: string
  message: string
  timestamp: Date
  filesChanged: number
  insertions: number
  deletions: number
  files: FileChange[]
}

export interface FileChange {
  filePath: string
  changeType: 'added' | 'modified' | 'deleted'
  insertions: number
  deletions: number
}

export interface GitOptions {
  from?: string
  to?: string
  maxCount?: number
  author?: string
  since?: string
  until?: string
}