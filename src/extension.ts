/*
 * @Author: guowei26
 * @Date: 2023-04-21 14:53:27
 * @LastEditors: guowei26
 * @LastEditTime: 2023-07-24 16:49:30
 * @FilePath: /common-less-replacer/src/extension.ts
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as less from 'less';
import * as _ from 'lodash';
import * as events from 'events';
import LessVarCompletionProvider from './LessVarCompletionProvider';
import {LessTypeEnum, LineAstItemIProps, LessAstListIProps} from './type';

// AST to Obj
const transferLessAstToLessObj = (rules: any[]) => {
    const lessObj: Record<string, LineAstItemIProps> = {};
    // TODO 暂未处理less变量
    rules.forEach(item => {
        const value = item.value?.value;
        if (item.type === LessTypeEnum.DECLARATION) {
            if (typeof value === 'string') {
                console.log(value);
                lessObj[item.name] = {
                    value: value,
                    type: LessTypeEnum.NUMBER
                };
            }
            if (Array.isArray(value) && value.length === 1) {
                const currentValue = value[0]?.value;
                if (
                    Array.isArray(currentValue) &&
                    currentValue.length === 1 &&
                    currentValue[0].type === LessTypeEnum.COLOR
                ) {
                    lessObj[item.name] = {
                        value: currentValue[0].value,
                        type: LessTypeEnum.COLOR
                    };
                }
            }
        }
    });
    return lessObj;
};

// AST value => value
const transferLessVar = (ast: any, common: any) => {
    for (const node of ast) {
        if (node.rules && node.rules.length > 0) {
            transferLessVar(node.rules, common);
        } else {
            const currentLessValue = node?.value?.value;
            if (typeof currentLessValue === 'string') {
                const varName = common.get(currentLessValue);
                if (varName) {
                    console.log('varName::::', varName);
                    node.value = new less.default.tree.Value([
                        new less.default.tree.Expression([new less.default.tree.Anonymous(varName)])
                    ]);
                }
            }
            if (Array.isArray(currentLessValue) && currentLessValue.length === 1) {
                const color = currentLessValue[0]?.value?.[0]?.value;
                const varName = common.get(color);
                if (varName) {
                    node.value = new less.default.tree.Value([
                        new less.default.tree.Expression([new less.default.tree.Anonymous(varName)])
                    ]);
                }
            }
        }
    }
};

// lessAST => LessMap
const getLessVarMap = (lessAst: any) => {
    const map: Map<string, string> = new Map();
    lessAst.forEach((varObj: any) => {
        Reflect.ownKeys(varObj).forEach(varName => {
            const varValue = varObj[varName as string]?.value;
            map.set(varValue, varName as string);
        });
    });
    return map;
};

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration();
    const filePathList = config.get<string[]>('conf.less.path') || [];
    const lessAst: LessAstListIProps = [];
    const fileWather: vscode.FileSystemWatcher[] = [];

    // 保存用户输入的less路径
    const disposable = vscode.commands.registerCommand('common-less-replacer.ConfigLessPath', async () => {
        const value = await vscode.window.showInputBox({
            prompt: '请输入所配置的less路径，多个的话请以逗号隔开',
            value: filePathList?.join(',')
        });
        if (value) {
            const pathList = value.split(',').filter(item => !!item);
            await config.update('conf.less.path', pathList, vscode.ConfigurationTarget.Workspace, true);
        }
    });

    // 当前页面css变量覆盖
    const modification = vscode.commands.registerCommand('common-less-replacer.ModifyCommonLess', async () => {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (!activeTextEditor) {
            return;
        }
        const document = activeTextEditor.document;
        const fileName = document.fileName;
        const cssFileNameExt = ['.less', '.scss'];
        const isCssFile = cssFileNameExt.some(name => fileName.includes(name));
        if (!isCssFile) {
            return;
        }
        let text = document.getText();
        less.default.parse(text, {processImports: false}, async function (error: any, ast: any) {
            if (error) {
                return;
            }
            const lessMap = getLessVarMap(lessAst);
            const cloneLessAst = _.cloneDeep(ast);
            transferLessVar(cloneLessAst.rules, lessMap);
            console.log('version::::', less.default.version, less.default.ParseTree);
            less.default.ParseTree(ast, function (error: any, output: any) {
                console.log(output, error);
                if (error) {
                    console.error('Error occurred while converting AST to LESS code:', error);
                } else {
                    const lessCode = output.css;
                }
            });
            // activeTextEditor.edit(editBuilder => {
            //     const firstLine = document.lineAt(0);
            //     const lastLine = document.lineAt(document.lineCount - 1);
            //     const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
            //     editBuilder.replace(textRange, modifiedLessCode);
            // });
        });
    });

    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        if (event.contentChanges.length) {
            const change = event.contentChanges[0];
            const line = change.range.start.line;
            const character = change.range.start.character;

            if (change.text === '' && character > 0) {
                // 删除了字符，重新启用自动完成功能
                const newPosition = new vscode.Position(line, character - 1);
                vscode.commands.executeCommand('vscode.executeCompletionItemProvider', event.document.uri, newPosition);
            }
        }
    });

    // less输入时自动补全-模糊搜索补全
    const autoLessProvider = vscode.languages.registerCompletionItemProvider(
        'less',
        new LessVarCompletionProvider(lessAst)
    );

    // less输入后,;结尾触发自动补全
    const rightLessProvider = vscode.languages.registerCompletionItemProvider(
        'less',
        new LessVarCompletionProvider(lessAst, ';'),
        ';'
    );

    // 根据用户输入的less文件路径，创建文件修改监听
    filePathList.forEach((url, urlIndex) => {
        const fileUrl = vscode.workspace.rootPath && path.join(vscode.workspace.rootPath, url);
        const existFiles = fileUrl && fs.existsSync(fileUrl);
        if (existFiles) {
            const watcher = vscode.workspace.createFileSystemWatcher(fileUrl);
            fileWather.push(watcher);
            const fileContent = fs.readFileSync(fileUrl, 'utf-8');
            less.default.parse(fileContent, {processImports: false}, function (error: any, result: any) {
                if (error) {
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

    fileWather.forEach((watcher, watchIndex) => {
        context.subscriptions.push(watcher);
        watcher.onDidChange(async event => {
            if (event.fsPath) {
                const fileContent = await vscode.workspace.fs.readFile(event);
                const decorder = new util.TextDecoder();
                const content = decorder.decode(fileContent);
                // TODO 支持 @import引入的less文件
                // TODO 删除less文件后的处理
                const result = await less.default.parse(content, {processImports: false});
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
    context.subscriptions.push(autoLessProvider, rightLessProvider, disposable, modification);
}

export function deactivate(context: vscode.ExtensionContext) {
    // context.subscriptions.forEach(item => {
    //     item.dispose?.();
    // });
}
