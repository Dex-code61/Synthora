import OpenAI from 'openai';
import { FileMetrics } from '@/types/analysis';
import { Commit, FileChange } from '@/types/git';
import { storyErrorHandler, StoryError } from './story-error-handler';

export interface FileStory {
  filePath: string;
  story: string;
  sections: {
    creation: string;
    evolution: string;
    keyChanges: string[];
    currentState: string;
    recommendations: string[];
  };
  generatedAt: Date;
}

export interface StoryGenerationOptions {
  includeRecommendations?: boolean;
  maxLength?: 'short' | 'medium' | 'long';
  focusArea?: 'technical' | 'business' | 'maintenance';
}

export class StoryGenerator {
  private openai: OpenAI;
  private fallbackEnabled: boolean;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.fallbackEnabled = true;
  }

  /**
   * Generate a comprehensive story about a file's evolution
   */
  async generateFileStory(
    filePath: string,
    fileHistory: FileChange[],
    metrics: FileMetrics,
    commits: Commit[],
    options: StoryGenerationOptions = {}
  ): Promise<FileStory> {
    try {
      return await storyErrorHandler.executeWithRetry(async () => {
        const prompt = this.buildFileStoryPrompt(filePath, fileHistory, metrics, commits, options);
        const response = await this.callOpenAI(prompt);
        return this.parseStoryResponse(filePath, response);
      });
    } catch (error) {
      console.error('Error generating file story:', error);
      
      if (this.fallbackEnabled) {
        const storyError = storyErrorHandler.classifyError(error);
        console.warn(`Using fallback story generation: ${storyError.message}`);
        
        return storyErrorHandler.generateEnhancedFallbackStory(
          filePath, 
          fileHistory, 
          metrics, 
          commits
        );
      }
      
      throw error;
    }
  }

  /**
   * Generate team collaboration insights
   */
  async generateTeamInsights(
    repositoryName: string,
    commits: Commit[],
    collaborationData: any
  ): Promise<string> {
    try {
      return await storyErrorHandler.executeWithRetry(async () => {
        const prompt = this.buildTeamInsightsPrompt(repositoryName, commits, collaborationData);
        return await this.callOpenAI(prompt);
      });
    } catch (error) {
      console.error('Error generating team insights:', error);
      
      if (this.fallbackEnabled) {
        const storyError = storyErrorHandler.classifyError(error);
        console.warn(`Using fallback team insights: ${storyError.message}`);
        return this.generateFallbackTeamInsights(repositoryName, commits);
      }
      
      throw error;
    }
  }

  /**
   * Build the main prompt for file story generation
   */
  private buildFileStoryPrompt(
    filePath: string,
    fileHistory: FileChange[],
    metrics: FileMetrics,
    commits: Commit[],
    options: StoryGenerationOptions
  ): string {
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const fileType = this.getFileTypeDescription(fileExtension);
    
    const recentCommits = commits
      .filter(commit => commit.files.some(f => f.filePath === filePath))
      .slice(0, 10)
      .map(commit => ({
        date: commit.timestamp.toISOString().split('T')[0],
        author: commit.author,
        message: commit.message.split('\n')[0], // First line only
        changes: commit.files.find(f => f.filePath === filePath)
      }));

    const prompt = `You are a senior software engineer analyzing the evolution of a code file. Generate a comprehensive, engaging story about this file's journey through the codebase.

**File Information:**
- Path: ${filePath}
- Type: ${fileType}
- Total Commits: ${metrics.commitCount}
- Authors: ${metrics.authorCount}
- Risk Score: ${metrics.riskScore.toFixed(2)}/1.0
- Total Changes: ${metrics.totalChanges}
- Bug-related Commits: ${metrics.bugCommits}
- Last Modified: ${metrics.lastModified.toISOString().split('T')[0]}

**Recent Commit History:**
${recentCommits.map(commit => 
  `- ${commit.date} by ${commit.author}: ${commit.message} (${commit.changes?.changeType}, +${commit.changes?.insertions}/-${commit.changes?.deletions})`
).join('\n')}

**Instructions:**
1. Write in an engaging, narrative style that tells the "story" of this file
2. Structure your response as a JSON object with these sections:
   - "creation": How and why this file was born (2-3 sentences)
   - "evolution": Key phases in the file's development (3-4 sentences)
   - "keyChanges": Array of 3-5 most significant changes with brief descriptions
   - "currentState": Current status and characteristics (2-3 sentences)
   - "recommendations": Array of 2-4 actionable recommendations for this file

3. Consider the file's risk score and metrics in your analysis
4. Use technical language appropriate for developers
5. Focus on insights that would help a developer understand this file's role and history
6. If the risk score is high (>0.7), emphasize potential issues and maintenance needs
7. Keep the total response under 500 words

Generate a story that helps developers understand this file's journey, current state, and future needs.`;

    return prompt;
  }

  /**
   * Build prompt for team insights generation
   */
  private buildTeamInsightsPrompt(
    repositoryName: string,
    commits: Commit[],
    collaborationData: any
  ): string {
    const authors = [...new Set(commits.map(c => c.author))];
    const timespan = this.calculateTimespan(commits);
    
    return `Analyze the collaboration patterns in the ${repositoryName} repository and provide insights about team dynamics.

**Repository Stats:**
- Total Commits: ${commits.length}
- Active Contributors: ${authors.length}
- Timespan: ${timespan}
- Top Contributors: ${authors.slice(0, 5).join(', ')}

**Recent Activity:**
${commits.slice(0, 10).map(c => 
  `- ${c.timestamp.toISOString().split('T')[0]} by ${c.author}: ${c.message.split('\n')[0]}`
).join('\n')}

Provide insights about:
1. Team collaboration patterns
2. Knowledge distribution
3. Potential knowledge silos
4. Recommendations for improving collaboration

Keep the response concise and actionable (under 300 words).`;
  }

  /**
   * Call OpenAI API with error handling and retries
   */
  private async callOpenAI(prompt: string, maxRetries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software engineer and technical writer who specializes in analyzing code evolution and team dynamics.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        return content;
      } catch (error: any) {
        console.error(`OpenAI API attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('All OpenAI API attempts failed');
  }

  /**
   * Parse the AI response into structured story format
   */
  private parseStoryResponse(filePath: string, response: string): FileStory {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      
      return {
        filePath,
        story: this.buildNarrativeFromSections(parsed),
        sections: {
          creation: parsed.creation || '',
          evolution: parsed.evolution || '',
          keyChanges: Array.isArray(parsed.keyChanges) ? parsed.keyChanges : [],
          currentState: parsed.currentState || '',
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        },
        generatedAt: new Date()
      };
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      return {
        filePath,
        story: response,
        sections: {
          creation: '',
          evolution: '',
          keyChanges: [],
          currentState: '',
          recommendations: []
        },
        generatedAt: new Date()
      };
    }
  }

  /**
   * Build a narrative story from structured sections
   */
  private buildNarrativeFromSections(sections: any): string {
    const parts = [];
    
    if (sections.creation) {
      parts.push(`**The Beginning**\n${sections.creation}`);
    }
    
    if (sections.evolution) {
      parts.push(`**Evolution**\n${sections.evolution}`);
    }
    
    if (sections.keyChanges && sections.keyChanges.length > 0) {
      parts.push(`**Key Changes**\n${sections.keyChanges.map((change: string) => `• ${change}`).join('\n')}`);
    }
    
    if (sections.currentState) {
      parts.push(`**Current State**\n${sections.currentState}`);
    }
    
    if (sections.recommendations && sections.recommendations.length > 0) {
      parts.push(`**Recommendations**\n${sections.recommendations.map((rec: string) => `• ${rec}`).join('\n')}`);
    }
    
    return parts.join('\n\n');
  }

  /**
   * Generate fallback story when AI service fails
   */
  private generateFallbackStory(
    filePath: string,
    fileHistory: FileChange[],
    metrics: FileMetrics,
    commits: Commit[]
  ): FileStory {
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const fileType = this.getFileTypeDescription(fileExtension);
    
    const story = `This ${fileType} file has been part of the codebase for some time, with ${metrics.commitCount} commits from ${metrics.authorCount} different authors. 

The file has seen ${metrics.totalChanges} total changes and has a risk score of ${metrics.riskScore.toFixed(2)}, indicating ${this.getRiskDescription(metrics.riskScore)} maintenance needs.

${metrics.bugCommits > 0 ? `There have been ${metrics.bugCommits} bug-related commits, suggesting this file may benefit from additional testing or refactoring.` : 'The file appears to be relatively stable with few bug-related changes.'}

Last modified on ${metrics.lastModified.toISOString().split('T')[0]}, this file continues to be an active part of the codebase.`;

    return {
      filePath,
      story,
      sections: {
        creation: `This ${fileType} file was created as part of the codebase development.`,
        evolution: `The file has evolved through ${metrics.commitCount} commits by ${metrics.authorCount} authors.`,
        keyChanges: [`${metrics.totalChanges} total changes made`, `${metrics.bugCommits} bug fixes applied`],
        currentState: `Currently has a risk score of ${metrics.riskScore.toFixed(2)} and was last modified on ${metrics.lastModified.toISOString().split('T')[0]}.`,
        recommendations: this.generateFallbackRecommendations(metrics)
      },
      generatedAt: new Date()
    };
  }

  /**
   * Generate fallback team insights
   */
  private generateFallbackTeamInsights(repositoryName: string, commits: Commit[]): string {
    const authors = [...new Set(commits.map(c => c.author))];
    const timespan = this.calculateTimespan(commits);
    
    return `The ${repositoryName} repository shows ${commits.length} commits from ${authors.length} contributors over ${timespan}. 

The most active contributors are: ${authors.slice(0, 3).join(', ')}.

This level of activity suggests ${authors.length > 5 ? 'good team collaboration' : 'a small, focused team'}. Consider reviewing code ownership patterns to ensure knowledge is well distributed across the team.`;
  }

  /**
   * Get file type description based on extension
   */
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

  /**
   * Get risk description based on score
   */
  private getRiskDescription(score: number): string {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'moderate';
    return 'low';
  }

  /**
   * Generate fallback recommendations based on metrics
   */
  private generateFallbackRecommendations(metrics: FileMetrics): string[] {
    const recommendations = [];
    
    if (metrics.riskScore > 0.7) {
      recommendations.push('Consider refactoring to reduce complexity and risk');
    }
    
    if (metrics.authorCount === 1) {
      recommendations.push('Consider having other team members review and contribute to reduce knowledge silos');
    }
    
    if (metrics.bugCommits > metrics.commitCount * 0.3) {
      recommendations.push('Add more comprehensive tests to catch issues early');
    }
    
    if (metrics.commitCount > 50) {
      recommendations.push('Review if this file has grown too large and should be split');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('File appears to be in good condition, continue current maintenance practices');
    }
    
    return recommendations;
  }

  /**
   * Calculate timespan of commits
   */
  private calculateTimespan(commits: Commit[]): string {
    if (commits.length === 0) return 'no commits';
    
    const dates = commits.map(c => c.timestamp).sort((a, b) => a.getTime() - b.getTime());
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    
    const diffMs = latest.getTime() - earliest.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }

  /**
   * Enable or disable fallback functionality
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }
}

export const storyGenerator = new StoryGenerator();