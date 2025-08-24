declare module "kiro" {
  export interface ExtensionContext {
    subscriptions: Disposable[];
    extensionPath: string;
    globalState: Memento;
    workspaceState: Memento;
  }

  export interface Disposable {
    dispose(): void;
  }

  export interface Memento {
    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue: T): T;
    update(key: string, value: any): Thenable<void>;
  }

  export interface Uri {
    scheme: string;
    authority: string;
    path: string;
    query: string;
    fragment: string;
    fsPath: string;
    toString(): string;
  }

  export interface TextDocument {
    uri: Uri;
    fileName: string;
    isUntitled: boolean;
    languageId: string;
    version: number;
    isDirty: boolean;
    isClosed: boolean;
    getText(): string;
    getText(range?: Range): string;
  }

  export interface Range {
    start: Position;
    end: Position;
  }

  export interface Position {
    line: number;
    character: number;
  }

  export interface WorkspaceFolder {
    uri: Uri;
    name: string;
    index: number;
  }

  export interface WebviewPanel {
    readonly webview: Webview;
    readonly viewType: string;
    title: string;
    readonly options: WebviewPanelOptions;
    readonly active: boolean;
    readonly visible: boolean;
    reveal(viewColumn?: ViewColumn, preserveFocus?: boolean): void;
    dispose(): void;
    onDidDispose: Event<void>;
    onDidChangeViewState: Event<WebviewPanelOnDidChangeViewStateEvent>;
  }

  export interface Webview {
    html: string;
    options: WebviewOptions;
    postMessage(message: any): Thenable<boolean>;
    onDidReceiveMessage: Event<any>;
  }

  export interface WebviewOptions {
    enableScripts?: boolean;
    enableCommandUris?: boolean;
    retainContextWhenHidden?: boolean;
    localResourceRoots?: Uri[];
  }

  export interface WebviewPanelOptions {
    enableFindWidget?: boolean;
    retainContextWhenHidden?: boolean;
  }

  export interface WebviewPanelOnDidChangeViewStateEvent {
    readonly webviewPanel: WebviewPanel;
  }

  export interface Event<T> {
    (
      listener: (e: T) => any,
      thisArgs?: any,
      disposables?: Disposable[]
    ): Disposable;
  }

  export enum ViewColumn {
    Active = -1,
    Beside = -2,
    One = 1,
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
  }

  export namespace commands {
    export function registerCommand(
      command: string,
      callback: (...args: any[]) => any
    ): Disposable;
    export function executeCommand<T = unknown>(
      command: string,
      ...rest: any[]
    ): Thenable<T>;
  }

  export namespace window {
    export function showInformationMessage(
      message: string,
      ...items: string[]
    ): Thenable<string | undefined>;
    export function showWarningMessage(
      message: string,
      ...items: string[]
    ): Thenable<string | undefined>;
    export function showErrorMessage(
      message: string,
      ...items: string[]
    ): Thenable<string | undefined>;
    export function createWebviewPanel(
      viewType: string,
      title: string,
      showOptions:
        | ViewColumn
        | { viewColumn: ViewColumn; preserveFocus?: boolean },
      options?: WebviewPanelOptions & WebviewOptions
    ): WebviewPanel;
    export const activeTextEditor: TextEditor | undefined;
  }

  export interface TextEditor {
    document: TextDocument;
    selection: Selection;
    selections: Selection[];
    visibleRanges: Range[];
    options: TextEditorOptions;
    viewColumn?: ViewColumn;
  }

  export interface Selection extends Range {
    anchor: Position;
    active: Position;
    isReversed: boolean;
  }

  export interface TextEditorOptions {
    tabSize?: number | string;
    insertSpaces?: boolean | string;
    cursorStyle?: TextEditorCursorStyle;
    lineNumbers?: TextEditorLineNumbersStyle;
  }

  export enum TextEditorCursorStyle {
    Line = 1,
    Block = 2,
    Underline = 3,
    LineThin = 4,
    BlockOutline = 5,
    UnderlineThin = 6,
  }

  export enum TextEditorLineNumbersStyle {
    Off = 0,
    On = 1,
    Relative = 2,
  }

  export namespace workspace {
    export const workspaceFolders: readonly WorkspaceFolder[] | undefined;
    export function getWorkspaceFolder(uri: Uri): WorkspaceFolder | undefined;
    export const onDidChangeWorkspaceFolders: Event<WorkspaceFoldersChangeEvent>;
  }

  export interface WorkspaceFoldersChangeEvent {
    readonly added: readonly WorkspaceFolder[];
    readonly removed: readonly WorkspaceFolder[];
  }

  export namespace Uri {
    export function file(path: string): Uri;
  }
}
