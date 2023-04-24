/*
 * @Author: guowei26
 * @Date: 2023-04-21 14:53:27
 * @LastEditors: guowei26
 * @LastEditTime: 2023-04-24 17:44:50
 * @FilePath: /common-less-replacer/src/extension.ts
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as less from 'less';

const enum LessTypeEnum { 
	DECLARATION = 'Declaration',
	COLOR='Color'
}

// AST to Obj
const transferLessAstToLessObj = (rules: any[]) => { 
	const lessObj: Record<string, string> = {};
	// TODO 暂未处理less变量
	rules.forEach(item => { 
		const value = item.value?.value;
		if (item.type===LessTypeEnum.DECLARATION) { 
			if (typeof value ==='string') { 
				lessObj[item.name]=value;
			}
			if (Array.isArray(value)&&value.length===1) { 
				const currentValue = value[0]?.value;
				if (Array.isArray(currentValue)&&currentValue.length===1&&currentValue[0].type===LessTypeEnum.COLOR) { 
					lessObj[item.name]=currentValue[0].value;
				}
			}
		}
	});
	return lessObj;
};

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration();
	const filePathList = config.get<string[]>('conf.less.path') || [];
	const lessAst:Array<Record<string,string>> = [];
	const fileWather: vscode.FileSystemWatcher[] = [];
	// 保存用户输入的less路径
	const disposable = vscode.commands.registerCommand('common-less-replacer.helloWorld', async () => {
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
	filePathList.forEach((url,urlIndex) => { 
		const fileUrl = vscode.workspace.rootPath&& path.join(vscode.workspace.rootPath,url);
		const existFiles = fileUrl && fs.existsSync(fileUrl);
		if (existFiles) { 
			const watcher = vscode.workspace.createFileSystemWatcher(fileUrl);
			fileWather.push(watcher);
			const fileContent = fs.readFileSync(fileUrl, 'utf-8');
			less.default.parse(fileContent, { processImports: false }, function (error: any, result: any,) { 
				if (error) { 
					console.log('err:::::', error);
					return; 
				}
				const lessObj = transferLessAstToLessObj(result.rules);
				if (lessAst?.[urlIndex]) {
					lessAst[urlIndex] = lessObj;
				} else { 
					lessAst.push(lessObj);
				}
			});	
			console.log(lessAst);
		}
	});

	fileWather.forEach((watcher,watchIndex) => { 
		context.subscriptions.push(watcher);
		watcher.onDidChange(async event => { 
			if (event.fsPath) { 
				const fileContent = await vscode.workspace.fs.readFile(event);
				const decorder = new util.TextDecoder();
				const content = decorder.decode(fileContent);
				// TODO 支持 @import引入的less文件
				// TODO 删除less文件后的处理
				const result = await less.default.parse(content, { processImports: false });
				const lessObj = transferLessAstToLessObj(result.rules);
				if (lessAst?.[watchIndex]) {
					lessAst[watchIndex] = lessObj;
				} else { 
					lessAst.push(lessObj);
				}
				console.log('改变后的less内容', lessAst);
			}
			
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	// TODO wather删除
}