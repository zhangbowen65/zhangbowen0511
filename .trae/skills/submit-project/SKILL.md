---
name: submit-project
description: 提交当前项目到课堂 Gitee 仓库。当用户要求提交项目、提交作业、推送代码到 submit-during-class 时使用。执行 git add、commit、push 全流程并报告结果。
---

# 提交项目

把当前项目（e:\project）提交并推送到课堂仓库。

## 仓库信息

- 远程地址：https://gitee.com/zhang--bowen/submit-during-class.git
- 远程名：origin
- 分支：master（Gitee 默认分支；若本地是 main，先 `git branch -M master`）

## 执行流程

在 e:\project 目录下依次执行：

1. 检查身份：`git config user.name` 与 `git config user.email`。若未配置，停下来让用户配置，不要擅自修改 git config。
2. 检查远程：`git remote -v`。若没有 origin，执行 `git remote add origin https://gitee.com/zhang--bowen/submit-during-class.git`；若地址不符，用 `git remote set-url origin <地址>` 修正。
3. 查看变更：`git status` 与 `git diff --stat`，向用户简要说明将提交的内容。
4. 暂存：`git add -A`。本项目无密钥文件；若发现 .env、证书等敏感文件，先警告用户。
5. 提交：提交信息用一句话概括本次变更，例如 `git commit -m "添加图标示例页与移动端下导航"`。不要把大段工具输出写进提交信息。
6. 推送：首次执行 `git push -u origin master`，之后 `git push`。
7. 推送被拒（远端有更新）：执行 `git pull --rebase origin master` 后重试 push；不要 force push。
8. 完成后报告：提交哈希、提交信息、推送到的远程分支。

## 约束

- 不修改用户的 git 全局配置（user.name / user.email 缺失时提示用户自行设置）。
- 不使用 --force、--no-verify。
- 推送需要用户的 Gitee 凭据；若弹出认证窗口或需要输入密码，交给用户完成。
