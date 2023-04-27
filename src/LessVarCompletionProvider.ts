/*
 * @Author: guowei26
 * @Date: 2023-04-24 19:03:53
 * @LastEditors: guowei26
 * @LastEditTime: 2023-04-27 17:20:58
 * @FilePath: /common-less-replacer/src/LessVarCompletionProvider.ts
 * @Description: less输入文字监测
 */
import * as vscode from 'vscode';
import {LessAstListIProps, LessTypeEnum} from './type';

const createCompletion = (list: Array<any>, character?: string) => {
    return list.map(item => {
        const currentCompletionItem = new vscode.CompletionItem(
            `${item.key} : ${item.value}`,
            vscode.CompletionItemKind.Variable
        );
        currentCompletionItem.detail = item.key;
        currentCompletionItem.insertText = item.key;

        return currentCompletionItem;
    });
};

export default class ColorCompletionProvider implements vscode.CompletionItemProvider {
    private lessAst: LessAstListIProps;
    private character?: string;

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const line = document.lineAt(position.line).text;
        const currentLessAst = this.lessAst.reduce((total, current) => {
            return {...total, ...current};
        }, {});
        // 存在特定字符触发
        if (this.character) {
            if (!line.endsWith(this.character)) {
                return [];
            }
            const realLinePrefix = line.replace(/;/g, '').split(':');
            if (realLinePrefix.length === 2) {
                const value = realLinePrefix[1].replace(/\s*/g, '');
                const currentLessAst = this.lessAst.reduce((total, current) => {
                    return {...total, ...current};
                }, {});
                const targetVar: Array<{key: string; value: string}> = [];
                Object.keys(currentLessAst).forEach((key: string) => {
                    const currentLess = currentLessAst[key];
                    if (currentLess.value.includes(value)) {
                        targetVar.push({key, value: currentLess.value});
                    }
                });
                if (targetVar.length > 0) {
                    const currentCompletionList: vscode.CompletionItem[] = createCompletion(targetVar, this.character);
                    return currentCompletionList;
                }
                return [];
            }
            return [];
        }
        const targetVar: Array<{key: string; value: string; type: LessTypeEnum}> = [];
        Object.keys(currentLessAst).forEach((key: string) => {
            const currentLess = currentLessAst[key];
            targetVar.push({key, value: currentLess.value, type: currentLess.type});
        });
        const currentCompletionList: vscode.CompletionItem[] = createCompletion(targetVar);
        return currentCompletionList;
    }

    constructor(lessAst: LessAstListIProps, character?: string) {
        this.lessAst = lessAst;
        this.character = character;
    }
}
