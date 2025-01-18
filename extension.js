const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { createTreeGraph } = require("./functions");
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const createTree = vscode.commands.registerCommand(
    "treejs.analyze",

    function () {
      vscode.window
        .showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: true,
          canSelectMany: false,
        })
        .then((uri) => {
          const folderPath = uri[0].fsPath;
          const initialData = createTreeGraph(folderPath);

          // Create and show panel
          const panel = vscode.window.createWebviewPanel(
            "reactWebview",
            "React Webview",
            vscode.ViewColumn.One,
            {
              enableScripts: true,
              localResourceRoots: [
                vscode.Uri.file(
                  path.join(context.extensionPath, "webview-ui", "dist")
                ),
              ],
            }
          );

          // Get path to Vite build output
          const webviewPath = path.join(
            context.extensionPath,
            "webview-ui",
            "dist"
          );

          // Read the HTML file
          const indexHtml = fs.readFileSync(
            path.join(webviewPath, "index.html"),
            "utf8"
          );

          const htmlData = indexHtml.replace(
            "</head>",
            `<script>window.initialData = ${JSON.stringify(
              initialData
            )};</script></head>`
          );

          // Convert paths in the HTML to webview URIs
          const webviewHtml = htmlData.replace(
            /(href|src)="([^"]*)"/g,
            (match, p1, p2) => {
              if (p2.startsWith("/")) {
                p2 = p2.slice(1); // Remove leading slash
              }
              const uri = vscode.Uri.file(path.join(webviewPath, p2));
              return `${p1}="${panel.webview.asWebviewUri(uri)}"`;
            }
          );

          panel.webview.html = webviewHtml;

          // Handle messages from the webview
          panel.webview.onDidReceiveMessage(
            (message) => {
              switch (message.command) {
                case "alert":
                  vscode.window.showInformationMessage(message.text);
                  return;
              }
            },
            undefined,
            context.subscriptions
          );
        });
    }
  );

  context.subscriptions.push(createTree);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
