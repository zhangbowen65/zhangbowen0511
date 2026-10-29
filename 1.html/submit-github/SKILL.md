---
name: submit-github
description: 提交当前项目到 GitHub 仓库 zhangbowen0511。当用户要求提交到 github、push 到 GitHub、同步代码到 zhangbowen0511 仓库时使用。执行 git add、commit、push 全流程（SSH 公钥认证）并报告结果。
---

# 提交到 GitHub

把当前项目（e:\project）提交并推送到 GitHub 仓库。用户已配置 SSH 公钥，走 SSH 认证。

## 仓库信息

- 远程地址（SSH）：`git@github.com:zhangbowen65/zhangbowen0511.git`
- 远程名：`github`（与课堂 Gitee 的 origin 并存，互不影响）
- 分支：master（本地当前分支；GitHub 空仓库可直接接收 master）

## 执行流程

在 e:\project 目录下依次执行：

1. 检查身份：`git config user.name` 与 `git config user.email`。本仓库应已有仓库级配置（Zhang Bowen / zhangbowen@example.com）；若缺失，停下来让用户配置，不要擅自改 git config。
2. 检查远程：`git remote -v`。若没有名为 github 的远程，执行 `git remote add github git@github.com:zhangbowen65/zhangbowen0511.git`。
3. SSH 连通性：`ssh -T git@github.com`。返回 "Hi zhangbowen65!" 即认证成功（此命令退出码为 1 属正常）。若提示 host key 验证失败，先执行 `ssh-keyscan github.com >> "$HOME/.ssh/known_hosts"` 再重试。
4. 查看变更：`git status` 与 `git diff --stat`，向用户简要说明将提交的内容。
5. 暂存：`git add -A`。若发现 .env、证书、私钥等敏感文件，先警告用户再继续。
6. 提交：提交信息用一句话概括本次变更，例如 `git commit -m "完成成绩面板等级一等级二作业"`。不要把工具输出写进提交信息。
7. 推送：首次执行 `git push -u github master`，之后 `git push github master`。
8. 推送被拒（远端有初始提交如 README/LICENSE）：执行 `git fetch github` 后 `git pull --rebase github master`，再重试 push；不要 force push。
9. 完成后报告：提交哈希、提交信息、推送到的远程分支、仓库链接 https://github.com/zhangbowen65/zhangbowen0511 。

## 约束

- 不修改用户的 git 全局配置与 SSH 配置。
- 不使用 --force、--no-verify。
- SSH 密钥若设置了口令（passphrase）且弹出输入提示，交给用户完成。
- 不动 origin（Gitee）远程；两仓库推送互不干扰。
