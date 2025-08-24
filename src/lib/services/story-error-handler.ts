import { FileStory } from './story-generator';
import { FileMetrics } from '@/types/analysis';
import { Commit, FileChange } from '@/types/git';

export interface StoryError {
  type: 'ai_service' | 'network' | 'rate_limit' | 'validation' | 'unknown';
  message: string;
  originalError?: Error;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export interface ErrorRecoveryOptions {
  enableFallback: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
  fallbackQuality: 'basic' | 'enhanced';
}

export class StoryErrorHandler {
  private defaultOptions: ErrorRecoveryOptions = {
    enableFallback: true,
    maxRetries: 3,
    retryDelay: 1000,
    fallbackQuality: 'enhanced'
  };

  /**
   * Classify and handle errors from AI story generation
   */
  classifyError(error: any): StoryError {
    if (!error) {
      return {
        type: 'unknown',
        message: 'Unknown error occurred',
        retryable: false
      };
    }

    // OpenAI specific errors
    if (error.code) {
      switch (error.code) {
        case 'rate_limit_exceeded':
          return {
            type: 'rate_limit',
            message: 'AI service rate limit exceeded',
            originalError: error,
            retryable: true,
            retryAfter: this.extractRetryAfter(error) || 60
          };
        
        case 'insufficient_quota':
          return {
            type: 'ai_service',
            message: 'AI service quota exceeded',
            originalError: error,
            retryable: false
          };
        
        case 'invalid_request_error':
          return {
            type: 'validation',
            message: 'Invalid request to AI service',
            originalError: error,
            retryable: false
          };
        
        case 'api_error':
          return {
            type: 'ai_service',
            message: 'AI service internal error',
            originalError: error,
            retryable: true
          };
      }
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return {
        type: 'network',
        message: 'Network connection failed',
        originalError: error,
        retryable: true
      };
    }

    // HTTP status errors
    if (error.status) {
      if (error.status >= 500) {
        return {
          type: 'ai_service',
          message: `AI service error (${error.status})`,
          originalError: error,
          retryable: true
        };
      } else if (error.status === 429) {
        return {
          type: 'rate_limit',
          message: 'Too many requests to AI service',
          originalError: error,
          retryable: true,
          retryAfter: this.extractRetryAfter(error) || 60
        };
      } else if (error.status >= 400) {
        return {
          type: 'validation',
          message: `Client error (${error.status})`,
          originalError: error,
          retryable: false
        };
      }
    }

    // Generic error
    return {
      type: 'unknown',
      message: error.message || 'Unknown error occurred',
      originalError: error,
      retryable: true
    };
  }

  /**
   * Generate enhanced fallback story with better quality
   */
  generateEnhancedFallbackStory(
    filePath: string,
    fileHistory: FileChange[],
    metrics: FileMetrics,
    commits: Commit[]
  ): FileStory {
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const fileType = this.getFileTypeDescription(fileExtension);
    const fileName = filePath.split('/').pop() || filePath;
    
    // Analyze commit patterns
    const commitAnalysis = this.analyzeCommitPatterns(commits, filePath);
    const authorAnalysis = this.analyzeAuthors(commits);
    const changeAnalysis = this.analyzeChanges(fileHistory);
    
    // Generate story sections
    const creation = this.generateCreationStory(filePath, fileType, commitAnalysis);
    const evolution = this.generateEvolutionStory(metrics, commitAnalysis, authorAnalysis);
    const keyChanges = this.generateKeyChanges(commitAnalysis, changeAnalysis);
    const currentState = this.generateCurrentState(metrics, fileType);
    const recommendations = this.generateEnhancedRecommendations(metrics, commitAnalysis, authorAnalysis);
    
    const story = this.buildNarrativeStory(fileName, fileType, {
      creation,
      evolution,
      keyChanges,
      currentState,
      recommendations
    });

    return {
      filePath,
      story,
      sections: {
        creation,
        evolution,
        keyChanges,
        currentState,
        recommendations
      },
      generatedAt: new Date()
    };
  }

  /**
   * Generate basic fallback story for minimal functionality
   */
  generateBasicFallbackStory(
    filePath: string,
    metrics: FileMetrics
  ): FileStory {
    const fileType = this.getFileTypeDescription(filePath.split('.').pop()?.toLowerCase());
    const fileName = filePath.split('/').pop() || filePath;
    
    const story = `${fileName} is a ${fileType} file that has been modified ${metrics.commitCount} times by ${metrics.authorCount} different contributors. The file has a risk score of ${metrics.riskScore.toFixed(2)} and was last updated on ${metrics.lastModified.toISOString().split('T')[0]}.`;
    
    return {
      filePath,
      story,
      sections: {
        creation: `${fileName} was created as part of the codebase.`,
        evolution: `The file has evolved through ${metrics.commitCount} commits.`,
        keyChanges: [`${metrics.totalChanges} total changes`, `${metrics.bugCommits} bug fixes`],
        currentState: `Currently has ${metrics.commitCount} commits and risk score ${metrics.riskScore.toFixed(2)}.`,
        recommendations: ['Review file for potential improvements', 'Consider adding documentation']
      },
      generatedAt: new Date()
    };
  }

  /**
   * Handle retry logic with exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<ErrorRecoveryOptions> = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;
    
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const storyError = this.classifyError(error);
        
        if (!storyError.retryable || attempt === opts.maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = storyError.retryAfter 
          ? storyError.retryAfter * 1000 
          : opts.retryDelay * Math.pow(2, attempt - 1);
        
        console.warn(`Story generation attempt ${attempt} failed, retrying in ${delay}ms:`, storyError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: StoryError): string {
    switch (error.type) {
      case 'rate_limit':
        return 'AI service is temporarily busy. Please try again in a few minutes.';
      case 'ai_service':
        return 'AI service is currently unavailable. A basic story has been generated instead.';
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'validation':
        return 'Invalid request. Please check the file path and try again.';
      default:
        return 'An unexpected error occurred. A fallback story has been generated.';
    }
  }

  private extractRetryAfter(error: any): number | undefined {
    if (error.headers && error.headers['retry-after']) {
      return parseInt(error.headers['retry-after']);
    }
    if (error.response && error.response.headers && error.response.headers['retry-after']) {
      return parseInt(error.response.headers['retry-after']);
    }
    return undefined;
  }

  private analyzeCommitPatterns(commits: Commit[], filePath: string) {
    const fileCommits = commits.filter(c => c.files.some(f => f.filePath === filePath));
    
    return {
      totalCommits: fileCommits.length,
      firstCommit: fileCommits[fileCommits.length - 1],
      lastCommit: fileCommits[0],
      bugFixes: fileCommits.filter(c => /\b(fix|bug|error|issue|patch)\b/i.test(c.message)),
      features: fileCommits.filter(c => /\b(add|feat|feature|implement)\b/i.test(c.message)),
      refactors: fileCommits.filter(c => /\b(refactor|cleanup|improve|optimize)\b/i.test(c.message)),
      avgCommitSize: fileCommits.reduce((sum, c) => sum + c.filesChanged, 0) / fileCommits.length || 0
    };
  }

  private analyzeAuthors(commits: Commit[]) {
    const authors = [...new Set(commits.map(c => c.author))];
    const authorCommits = authors.map(author => ({
      name: author,
      commits: commits.filter(c => c.author === author).length
    })).sort((a, b) => b.commits - a.commits);

    return {
      totalAuthors: authors.length,
      primaryAuthor: authorCommits[0],
      isTeamOwned: authorCommits.length > 1 && authorCommits[0].commits < commits.length * 0.7
    };
  }

  private analyzeChanges(fileHistory: FileChange[]) {
    return {
      totalChanges: fileHistory.length,
      additions: fileHistory.reduce((sum, c) => sum + c.insertions, 0),
      deletions: fileHistory.reduce((sum, c) => sum + c.deletions, 0),
      netChange: fileHistory.reduce((sum, c) => sum + c.insertions - c.deletions, 0)
    };
  }

  private generateCreationStory(filePath: string, fileType: string, commitAnalysis: any): string {
    const fileName = filePath.split('/').pop();
    const creationDate = commitAnalysis.firstCommit?.timestamp.toISOString().split('T')[0];
    const creator = commitAnalysis.firstCommit?.author;
    
    if (creationDate && creator) {
      return `${fileName} was created on ${creationDate} by ${creator} as a ${fileType} file. ${this.getCreationContext(commitAnalysis.firstCommit?.message)}`;
    }
    
    return `${fileName} is a ${fileType} file that was added to the codebase as part of the project development.`;
  }

  private generateEvolutionStory(metrics: FileMetrics, commitAnalysis: any, authorAnalysis: any): string {
    const timespan = this.calculateTimespan(commitAnalysis.firstCommit?.timestamp, commitAnalysis.lastCommit?.timestamp);
    const collaborationType = authorAnalysis.isTeamOwned ? 'collaborative effort' : 'primarily maintained by one developer';
    
    return `Over ${timespan}, this file has evolved through ${metrics.commitCount} commits in a ${collaborationType}. The development included ${commitAnalysis.features.length} feature additions, ${commitAnalysis.refactors.length} refactoring efforts, and ${commitAnalysis.bugFixes.length} bug fixes.`;
  }

  private generateKeyChanges(commitAnalysis: any, changeAnalysis: any): string[] {
    const changes = [];
    
    if (commitAnalysis.features.length > 0) {
      changes.push(`${commitAnalysis.features.length} feature implementations`);
    }
    
    if (commitAnalysis.bugFixes.length > 0) {
      changes.push(`${commitAnalysis.bugFixes.length} bug fixes and corrections`);
    }
    
    if (commitAnalysis.refactors.length > 0) {
      changes.push(`${commitAnalysis.refactors.length} refactoring and optimization efforts`);
    }
    
    if (changeAnalysis.netChange > 0) {
      changes.push(`Net growth of ${changeAnalysis.netChange} lines of code`);
    } else if (changeAnalysis.netChange < 0) {
      changes.push(`Code reduction of ${Math.abs(changeAnalysis.netChange)} lines`);
    }
    
    return changes.length > 0 ? changes : ['Regular maintenance and updates'];
  }

  private generateCurrentState(metrics: FileMetrics, fileType: string): string {
    const riskLevel = metrics.riskScore > 0.7 ? 'high' : metrics.riskScore > 0.4 ? 'moderate' : 'low';
    const stabilityNote = metrics.bugCommits > metrics.commitCount * 0.3 ? 'may benefit from additional testing' : 'appears relatively stable';
    
    return `This ${fileType} file currently has a ${riskLevel} risk score of ${metrics.riskScore.toFixed(2)} and ${stabilityNote}. Last modified on ${metrics.lastModified.toISOString().split('T')[0]}, it remains an active part of the codebase.`;
  }

  private generateEnhancedRecommendations(metrics: FileMetrics, commitAnalysis: any, authorAnalysis: any): string[] {
    const recommendations = [];
    
    if (metrics.riskScore > 0.7) {
      recommendations.push('Consider refactoring to reduce complexity and technical debt');
    }
    
    if (!authorAnalysis.isTeamOwned) {
      recommendations.push('Encourage code reviews from other team members to reduce knowledge silos');
    }
    
    if (metrics.bugCommits > metrics.commitCount * 0.2) {
      recommendations.push('Add comprehensive unit tests to catch regressions early');
    }
    
    if (commitAnalysis.avgCommitSize > 10) {
      recommendations.push('Consider breaking large changes into smaller, focused commits');
    }
    
    if (metrics.commitCount > 100) {
      recommendations.push('Evaluate if this file has grown too large and should be modularized');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('File appears well-maintained, continue current development practices');
    }
    
    return recommendations;
  }

  private buildNarrativeStory(fileName: string, fileType: string, sections: any): string {
    return `# The Story of ${fileName}

**${sections.creation}**

${sections.evolution}

**Key Developments:**
${sections.keyChanges.map((change: string) => `• ${change}`).join('\n')}

**Current Status:**
${sections.currentState}

**Recommendations:**
${sections.recommendations.map((rec: string) => `• ${rec}`).join('\n')}`;
  }

  private getFileTypeDescription(extension?: string): string {
    const typeMap: Record<string, string> = {
      'ts': 'TypeScript',
      'tsx': 'TypeScript React',
      'js': 'JavaScript',
      'jsx': 'JavaScript React',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'go': 'Go',
      'rs': 'Rust',
      'php': 'PHP',
      'rb': 'Ruby',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'css': 'CSS',
      'scss': 'SCSS',
      'html': 'HTML',
      'md': 'Markdown',
      'json': 'JSON',
      'yaml': 'YAML',
      'yml': 'YAML',
      'xml': 'XML',
      'sql': 'SQL'
    };
    
    return typeMap[extension || ''] || 'code';
  }

  private getCreationContext(message?: string): string {
    if (!message) return '';
    
    if (/initial|first|create|add/i.test(message)) {
      return 'This appears to be part of the initial project setup.';
    }
    
    if (/feature|implement/i.test(message)) {
      return 'It was created to implement new functionality.';
    }
    
    if (/fix|bug/i.test(message)) {
      return 'It was added as part of a bug fix or correction.';
    }
    
    return '';
  }

  private calculateTimespan(start?: Date, end?: Date): string {
    if (!start || !end) return 'its development period';
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }
}

export const storyErrorHandler = new StoryErrorHandler();