# common-less-replacer README

根据配置公共的 less 变量文件，替换 less 文件中的样式

```
// common.less
@red: red;

// pageA.less
color: red =>  color: @red;

```
