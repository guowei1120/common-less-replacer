/*
 * @Author: guowei26
 * @Date: 2023-07-26 15:27:01
 * @LastEditors: guowei26
 * @LastEditTime: 2023-07-28 14:35:37
 * @FilePath: /common-less-replacer/src/myPlugin.ts
 * @Description: 组件
 */
const less = require('less');
const postcss = require('postcss');

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
                    node.value = new less.default.tree.Value([
                        new less.default.tree.Expression([new less.default.tree.Anonymous('ce')])
                    ]);
                }
            }
            if (Array.isArray(currentLessValue) && currentLessValue.length === 1) {
                const color = currentLessValue[0]?.value?.[0]?.value;
                const varName = common.get(color);
                if (varName) {
                    node.value = new less.default.tree.Value([
                        new less.default.tree.Expression([new less.default.tree.Anonymous('ce')])
                    ]);
                }
            }
        }
    }
};

module.exports = postcss.plugin('custom-plugin', (options: any) => {
    return (root: {walkDecls: (arg0: (decl: any) => void) => void}, lessAst: any) => {
        // 在这里处理和修改 AST 节点
        console.log('options:::', options);
        root.walkDecls((decl: {prop: string; value: string}) => {
            // 示例：修改所有声明的属性名为大写
            const currentValue = options.get(decl.value);
            if (currentValue) {
                decl.value = currentValue;
            }
        });
    };
});
