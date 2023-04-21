/*
 * @Author: guowei26
 * @Date: 2023-04-21 14:53:27
 * @LastEditors: guowei26
 * @LastEditTime: 2023-04-21 18:13:03
 * @FilePath: /common-less-replacer/src/extension.ts
 */
import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration();
	const filePathList = config.get<string[]>('conf.less.path') || [];
	const lessAst = [];
	const fileWather = [];
	console.log(filePathList);

	// 保存用户输入的less路径
	let disposable = vscode.commands.registerCommand('common-less-replacer.helloWorld', async () => {
		const value = await vscode.window.showInputBox({
			prompt: "请输入所配置的less路径，多个的话请以逗号隔开",
			value: filePathList?.join(',')
		});
		if (value) { 
			const pathList = value.split(',').filter(item=>!!item);
			await config.update('conf.less.path', pathList, vscode.ConfigurationTarget.Workspace, true);
		}
	});

	// 根据用户输入的less文件路径，创建文件修改监听
	filePathList.forEach(item => { 
		const existFiles = fs.existsSync(item);
		if (existFiles) { 
			vscode.workspace.createFileSystemWatcher('**/*.{js,jsx,ts,tsx,css,less}');
		}
	});
	const watcher =


	context.subscriptions.push(disposable);
}

export function deactivate() {}
