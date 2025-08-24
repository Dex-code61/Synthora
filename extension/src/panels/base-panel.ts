import * as kiro from 'kiro'
import { ApiClient } from '../services/api-client'

export abstract class BasePanel {
  protected panel: kiro.WebviewPanel | undefined
  protected disposables: kiro.Disposable[] = []

  constructor(
    protected context: kiro.ExtensionContext,
    protected apiClient: ApiClient,
    protected viewType: string,
    protected title: string
  ) {}

  protected createPanel(): kiro.WebviewPanel {
    const panel = kiro.window.createWebviewPanel(
      this.viewType,
      this.title,
      kiro.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
      }
    )

    // Handle panel disposal
    panel.onDidDispose(() => {
      this.dispose()
    }, null, this.disposables)

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      undefined,
      this.disposables
    )

    return panel
  }

  protected abstract handleMessage(message: any): void
  protected abstract getHtmlContent(): string

  protected updateContent(): void {
    if (this.panel) {
      this.panel.webview.html = this.getHtmlContent()
    }
  }

  protected postMessage(message: any): void {
    if (this.panel) {
      this.panel.webview.postMessage(message)
    }
  }

  public dispose(): void {
    if (this.panel) {
      this.panel.dispose()
      this.panel = undefined
    }

    // Dispose of all disposables
    while (this.disposables.length) {
      const disposable = this.disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  protected getBaseHtml(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--kiro-font-family);
            font-size: var(--kiro-font-size);
            line-height: 1.6;
            color: var(--kiro-foreground);
            background-color: var(--kiro-editor-background);
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            border-bottom: 1px solid var(--kiro-panel-border);
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            color: var(--kiro-foreground);
            font-size: 24px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--kiro-descriptionForeground);
        }
        
        .error {
            background-color: var(--kiro-errorBackground);
            color: var(--kiro-errorForeground);
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        
        .success {
            background-color: var(--kiro-successBackground);
            color: var(--kiro-successForeground);
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        
        .button {
            background-color: var(--kiro-button-background);
            color: var(--kiro-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .button:hover {
            background-color: var(--kiro-button-hoverBackground);
        }
        
        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .card {
            background-color: var(--kiro-panel-background);
            border: 1px solid var(--kiro-panel-border);
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .card h3 {
            margin-top: 0;
            color: var(--kiro-foreground);
        }
        
        .metadata {
            font-size: 12px;
            color: var(--kiro-descriptionForeground);
            margin-bottom: 10px;
        }
        
        .content {
            white-space: pre-wrap;
            line-height: 1.6;
        }
        
        .risk-high {
            color: var(--kiro-errorForeground);
            font-weight: bold;
        }
        
        .risk-medium {
            color: var(--kiro-warningForeground);
            font-weight: bold;
        }
        
        .risk-low {
            color: var(--kiro-successForeground);
        }
        
        .timeline-item {
            border-left: 2px solid var(--kiro-panel-border);
            padding-left: 20px;
            margin-bottom: 20px;
            position: relative;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 8px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--kiro-foreground);
        }
        
        .timeline-date {
            font-size: 12px;
            color: var(--kiro-descriptionForeground);
            margin-bottom: 5px;
        }
        
        .timeline-message {
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .timeline-author {
            font-size: 12px;
            color: var(--kiro-descriptionForeground);
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .metric-item {
            background-color: var(--kiro-input-background);
            padding: 15px;
            border-radius: 4px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--kiro-foreground);
        }
        
        .metric-label {
            font-size: 12px;
            color: var(--kiro-descriptionForeground);
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage(type, data) {
            vscode.postMessage({ type, data });
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            handleMessage(message);
        });
        
        function handleMessage(message) {
            // Override in specific panels
        }
    </script>
</body>
</html>`
  }
}