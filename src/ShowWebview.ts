import * as vscode from 'vscode';
import { readdirSync, readFileSync } from 'fs';

export class ShowWebviewProvider implements vscode.CustomTextEditorProvider {
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		let currentPanel: vscode.WebviewPanel | undefined = undefined;
		const provider = new ShowWebviewProvider(context);
		const providerRegistration = vscode.commands.registerCommand('sample.showWebview', () => {
			 currentPanel = vscode.window.createWebviewPanel(
				'hosts-view',
				'hosts-view',
				vscode.ViewColumn.Two,
				{
					enableScripts:true
				}
			);
			currentPanel.webview.html = provider.getHtmlForWebview(currentPanel.webview);
	
			function updateWebview() {
				if(currentPanel === undefined){ return; }
				currentPanel.webview.postMessage({
					type: 'update',
				});
			}

		    function postMessage(json: String) {
				if(currentPanel === undefined){ return; }	
				currentPanel.webview.postMessage({
					message: json,
				});
			}
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				//今編集しているファイル名を得る
				let working_file_path = editor.document.fileName;
				console.log(working_file_path);
				
				//編集中のファイルのの内容取得
				const doc = editor.document;
				const text = doc.getText();
				//一行ずつ取得
				for (var i = 0; i < doc.lineCount; i++) {
					const line = doc.lineAt(i).text;
					const group: any = {};
				}
				postMessage('[edited]Post Message');
			}
		});

		// vscode.workspace.onDidChangeTextDocument((event) => {
		// 	if(currentPanel!==undefined){
		// 		currentPanel.webview.postMessage({message: 'success'});
		// 		console.log(event);
		// 	}
			
		// });

		return providerRegistration;
	}

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Called when our custom editor is opened.
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview

		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		// webviewPanel.webview.onDidReceiveMessage(e => {
		// 	switch (e.type) {
		// 		case 'add':
		// 			this.addNewScratch(document);
		// 			return;

		// 		case 'delete':
		// 			this.deleteScratch(document, e.id);
		// 			return;
		// 	}
		// });

		updateWebview();
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		const srcUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'react-src/build')
		);
		
		const baseUri = this.context.extensionUri.toString().replace(/^file:\/\//,'');
		const mainJsUri = readdirSync(baseUri+'/react-src/build/static/js/').filter(file => /^main\..*\.js$/.test(file))[0];
		const mainCssUri= readdirSync(baseUri+'/react-src/build/static/css/').filter(file => /^main\..*\.css$/.test(file))[0];

		return /* html */`
			<!doctype html>
			<html lang="en">
			<head>
			<meta charset="utf-8" />
			<link rel="icon" href="${srcUri}/favicon.ico" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			<meta name="theme-color" content="#000000" />
			<meta name="description" content="Web site created using create-react-app" />
			<link rel="apple-touch-icon" href="${srcUri}/logo192.png" />
			<link rel="manifest" href="${srcUri}/manifest.json" />
			<title>React App</title>
			<script defer="defer" src="${srcUri}/static/js/${mainJsUri}"></script>
			<link href="${srcUri}/static/css/${mainCssUri}" rel="stylesheet">
			</head>
			<body><noscript>You need to enable JavaScript to run this app.</noscript>
			<div id="root"></div>
			</body>
			</html>
		`;
	}
	
}