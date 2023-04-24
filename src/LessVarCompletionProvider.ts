/*
 * @Author: guowei26
 * @Date: 2023-04-24 19:03:53
 * @LastEditors: guowei26
 * @LastEditTime: 2023-04-24 20:13:54
 * @FilePath: /common-less-replacer/src/LessVarCompletionProvider.ts
 * @Description: less输入文字监测
 */
import * as vscode from 'vscode';
import {LessAstListIProps} from './type';

export default class ColorCompletionProvider implements vscode.CompletionItemProvider {
    private lessAst: LessAstListIProps;

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ) {
        const linePrefix = document.lineAt(position).text;
        if (!linePrefix.endsWith(';')) {
            return undefined;
        }
        const realLinePrefix = linePrefix.replace(/;/g, '').split(':');
        // 只有一个冒号的样式，认为这是一个正确的样式
        if (realLinePrefix.length === 2) {
            const value = realLinePrefix[1].replace(/\s*/g, '');
            const currentLessAst = this.lessAst.reduce((total, current) => {
                return {...total, ...current};
            }, {});
            Object.keys(currentLessAst).forEach((key: string) => {
                const currentLess = currentLessAst[key];
                if (currentLess.value === value) {
                }
            });
            console.log('value::::', value, currentLessAst);
        }
        return undefined;
    }

    constructor(lessAst: LessAstListIProps) {
        this.lessAst = lessAst;
    }
}
