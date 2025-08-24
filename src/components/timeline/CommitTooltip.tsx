'use client'

import React from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GitCommit, User, FileText, Plus, Minus } from 'lucide-react'
import { Commit } from '@/types/git'

interface CommitTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
}

export function CommitTooltip({ active, payload, label }: CommitTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  // Handle different chart types
  const data = payload[0]?.payload
  if (!data) return null

  // For scatter chart (individual commits)
  if (data.commit) {
    const commit: Commit = data.commit
    return (
      <Card className="max-w-sm shadow-lg border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-mono">
              {commit.sha.substring(0, 8)}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium line-clamp-2">
              {commit.message}
            </p>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{commit.author}</span>
            <span>•</span>
            <span>{format(new Date(commit.timestamp), 'PPp')}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{commit.filesChanged} files</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <Plus className="h-3 w-3" />
              <span>{commit.insertions}</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <Minus className="h-3 w-3" />
              <span>{commit.deletions}</span>
            </div>
          </div>

          {commit.files.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium mb-1">Files changed:</p>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {commit.files.slice(0, 5).map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Badge
                        variant={
                          file.changeType === 'added' ? 'default' :
                          file.changeType === 'modified' ? 'secondary' : 'destructive'
                        }
                        className="text-xs px-1 py-0"
                      >
                        {file.changeType[0].toUpperCase()}
                      </Badge>
                      <span className="font-mono truncate">
                        {file.filePath.split('/').pop()}
                      </span>
                    </div>
                  ))}
                  {commit.files.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{commit.files.length - 5} more files
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // For line chart (aggregated daily data)
  if (data.commits && Array.isArray(data.commits)) {
    const commits: Commit[] = data.commits
    const date = new Date(data.timestamp)
    
    return (
      <Card className="max-w-sm shadow-lg border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {format(date, 'PPPP')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Commits</p>
              <p className="font-semibold">{data.commitCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Files</p>
              <p className="font-semibold">{data.filesChanged}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-green-600">Insertions</p>
              <p className="font-semibold text-green-600">+{data.insertions}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-red-600">Deletions</p>
              <p className="font-semibold text-red-600">-{data.deletions}</p>
            </div>
          </div>

          {commits.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium mb-2">Recent commits:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {commits.slice(0, 3).map((commit, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">
                          {commit.sha.substring(0, 6)}
                        </span>
                        <span className="text-muted-foreground">
                          {commit.author}
                        </span>
                      </div>
                      <p className="line-clamp-1 mt-1">
                        {commit.message}
                      </p>
                    </div>
                  ))}
                  {commits.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{commits.length - 3} more commits
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}