/*
 * @Author: guowei26
 * @Date: 2023-04-24 19:49:05
 * @LastEditors: guowei26
 * @LastEditTime: 2023-04-27 16:17:46
 * @FilePath: /common-less-replacer/src/type.ts
 * @Description: 类型
 */
export const enum LessTypeEnum {
    DECLARATION = 'Declaration',
    COLOR = 'Color',
    STRING = 'String',
    NUMBER = 'Number'
}

export interface LineAstItemIProps {
    type: LessTypeEnum;
    value: string;
}

export type LessAstListIProps = Array<Record<string, LineAstItemIProps>>;
