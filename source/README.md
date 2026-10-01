# 网页版源代码

这是独立改造的 React + Vite 网页版源码，不包含 Electron。

把 source.zip 的内容解压到网页文件夹内新建的 source 子文件夹，目录形如：

- index.html（已构建网页）
- bg-removal/（已随网页提供的 AI 数据）
- source/package.json（此源码）

在 source 目录安装 Node.js 22 或更新版本，运行：

```sh
npm ci
npm run dev
```

生产构建：

```sh
npm run build
npm test
```

将新生成的 dist 目录里面的文件上传到 GitHub 仓库根目录。修改源码后也应重新压缩 source.zip 并更新网站上的源码下载。

预构建网页不需要 Node.js。AI 数据来自同包 bg-removal，构建前自动复制，避免压缩包内重复占用空间。资源校验测试验证模型分块哈希，编辑测试覆盖画笔、擦除、填充和整笔撤销。check-ai.cjs 是使用单线程 WASM 的本地模型推理检查。
