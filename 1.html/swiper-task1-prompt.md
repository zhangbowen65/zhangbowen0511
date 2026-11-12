# 任务一 · 提示词工程师：让 AI 听懂需求

> 目标：通过提示词让 AI 生成 `new Swiper('#wySw4', {...})` 的配置代码。
> 四条需求：① 无缝循环 ② 3.2 秒自动翻页且手动操作后不停止 ③ 圆点分页器可点击 ④ 初始效果为 cube。
> 演示对象页面：`swiper-task.html`（演示四，#wySw4）。

---

## 第 1 轮提示词（初版·故意写得随意）

> 帮我写一个 Swiper 的配置，要能循环播放，3.2 秒自动翻页，分页器可以点，效果用 cube。

### AI 第 1 轮回答（模拟 AI 的典型缺陷回答，实际验证时会发现问题）

```javascript
var swiper4 = new Swiper('#wysw4', {
  loop: true,
  effect: 'cube',
  autoplay: {
    delay: 3.2
  },
  pagination: {
    clickable: true
  }
});
```

### 逐条核对发现的问题（这就是"AI 答案大概率有遗漏或错误"的原因——提示词没说清楚）

| 需求 | AI 回答是否达标 | 问题分析 |
|------|----------------|----------|
| ① 无缝循环 | ✅ 基本达标 | loop: true 正确 |
| ② 3.2 秒自动翻页 | ❌ 错误 | `delay: 3.2` 单位错了，autoplay.delay 的单位是**毫秒**，3.2 毫秒等于没停，应写成 `3200` |
| ② 手动操作后不停止 | ❌ 遗漏 | 没写 `disableOnInteraction: false`（默认值为 true，用户一拖动自动播放就停了） |
| ③ 圆点分页器可点击 | ❌ 错误 | 只写了 `clickable: true`，**漏了 el**——没告诉 Swiper 圆点放哪，页面上已有的 `#wyPag4` 容器用不上 |
| ④ 初始效果 cube | ✅ 基本达标 | effect: 'cube' 正确 |
| 隐藏问题 | ❌ 选择器错误 | AI 照抄了我提示词里的 `#wysw4`，而页面里真实 id 是 **`#wySw4`**（S 是大写），粘进去轮播根本不初始化 |

**第 1 轮教训**：需求没有说清"单位、默认值陷阱、页面真实容器 id"，AI 只能靠猜。

---

## 第 2 轮提示词（修正版·补上下文、限单位、点明陷阱）

> 请生成 new Swiper 的初始化配置对象，目标页面是 swiper-task.html 的演示四，轮播容器真实 id 为 #wySw4（注意 S 大写），页面里已存在分页器容器 #wyPag4。要求：
> ① 开启无缝循环 loop: true；
> ② 自动轮播间隔 **3200 毫秒**（autoplay.delay 单位是毫秒），且用户手动滑动、点击分页器之后自动播放**不能停止**（autoplay 必须设置 disableOnInteraction: false）；
> ③ 分页器是圆点，pagination 的 el 必须绑定 #wyPag4，并开启 clickable: true 支持点击跳转；
> ④ 切换特效 effect: 'cube'；
> 只输出配置对象内容，不要额外解释。

### AI 第 2 轮回答（最终版）

```javascript
var swiper4 = new Swiper('#wySw4', {
  loop: true,                                  // ① 无缝循环
  effect: 'cube',                              // ④ 初始效果：cube 立方体
  autoplay: {
    delay: 3200,                               // ② 每 3.2 秒自动翻页（单位毫秒）
    disableOnInteraction: false                // ② 用户手动操作后自动播放不停止
  },
  pagination: {
    el: '#wyPag4',                             // ③ 绑定页面真实分页器容器
    clickable: true                            // ③ 点击圆点可跳转
  }
});
```

**逐条核对**：① ✅ loop ② ✅ 3200ms + disableOnInteraction: false ③ ✅ el 绑 #wyPag4 + clickable ④ ✅ cube —— 四条需求全部命中，无遗漏。

---

## 人工验证清单（粘进页面实测 + 截图 + 一句话结论）

粘贴位置：`swiper-task.html` 底部 `<script>` 中，替换掉原来的 `var swiper4 = new Swiper('#wySw4', {...})` 初始配置，保存刷新。

> ⚠️ 提示词原题写的是 `#wysw4`，页面真实 id 是 `#wySw4`（大写 S）——这正是第 1 轮翻车的隐藏考点之一。

| # | 需求 | 验证方法 | 截图 | 一句话结论 |
|---|------|----------|------|-----------|
| 1 | 无缝循环 | 用箭头/圆点翻到最后一张，再向后翻，应无缝回到第一张 | （贴图） | ＿＿＿＿＿＿ |
| 2 | 3.2 秒自动翻页且不停止 | 什么都不做观察约 3 秒一张；再用手拖动一次，松手后它应继续自动翻 | （贴图） | ＿＿＿＿＿＿ |
| 3 | 圆点分页器可点击 | 直接点第 4 个圆点，应立即跳到对应页且高亮 | （贴图） | ＿＿＿＿＿＿ |
| 4 | 初始效果 cube | 刷新后第一眼即是 3D 立方体旋转切换（非平推） | （贴图） | ＿＿＿＿＿＿ |

### 本任务收获（提示词工程三要点）

1. **给上下文**：不告诉 AI 页面真实容器 id（#wyPag4）和大小写细节，它就只能猜；
2. **限死单位和默认值陷阱**：delay 要写"毫秒 3200"而不是"3.2 秒"；disableOnInteraction 默认是 true，必须点名要求 false；
3. **限定输出格式**："只输出配置对象内容"，避免 AI 长篇解释，方便直接粘贴验证。
