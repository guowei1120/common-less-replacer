/*
 * @Author: guowei26
 * @Date: 2023-07-26 15:27:01
 * @LastEditors: guowei26
 * @LastEditTime: 2023-07-26 15:30:14
 * @FilePath: /common-less-replacer/src/myPlugin.js
 * @Description: 组件
 */
const postcss = require('postcss');

module.exports = postcss.plugin('custom-plugin', options => {
    return (root, lessAst) => {
        // 在这里处理和修改 AST 节点
        console.log(options);
        root.walkDecls(decl => {
            // 示例：修改所有声明的属性名为大写
            console.log('decl:::', decl);
            decl.prop = decl.prop.toUpperCase();
        });
    };
});
