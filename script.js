(function () {
  'use strict';

  /* ===== 常量 ===== */
  const zbw511_GAME_DURATION = 120; // 单局时长（秒）
  const zbw511_BEST_SCORE_KEY = 'catchBallBestScore';

  const zbw511_BALL_COUNT = 3;        // 同屏小球数量
  const zbw511_BALL_DIAMETER = 60;    // 小球直径（px），与 style.css 的 .zbw511_ball 尺寸保持一致
  const zbw511_EDGE_MARGIN = 10;      // 小球与游戏区边缘的最小间距（px）
  const zbw511_MAX_PLACEMENT_TRIES = 30; // 随机取位的最大尝试次数

  const zbw511_SCORE_HIT = 2;   // 命中小球加分
  const zbw511_SCORE_MISS = -1; // 点击空白扣分

  const zbw511_BALL_HIT_CLASS = 'zbw511_ball--hit';   // 命中动画类名
  const zbw511_FLOAT_TEXT_HIT = 'zbw511_float-text--hit';
  const zbw511_FLOAT_TEXT_MISS = 'zbw511_float-text--miss';
  const zbw511_GAME_AREA_FLASH_CLASS = 'zbw511_game-area--flash';

  /* ===== DOM 引用 ===== */
  const zbw511_scoreValueEl = document.getElementById('zbw511_score-value');
  const zbw511_timerValueEl = document.getElementById('zbw511_timer-value');
  const zbw511_ballsLayer = document.getElementById('zbw511_balls-layer');
  const zbw511_gameAreaEl = document.getElementById('zbw511_game-area');
  const zbw511_overlay = document.getElementById('zbw511_overlay');
  const zbw511_startBtn = document.getElementById('zbw511_start-btn');
  const zbw511_startView = document.getElementById('zbw511_start-view');
  const zbw511_resultPanel = document.getElementById('zbw511_result-panel');
  const zbw511_finalScoreEl = document.getElementById('zbw511_final-score');
  const zbw511_bestScoreEl = document.getElementById('zbw511_best-score');
  const zbw511_restartBtn = document.getElementById('zbw511_restart-btn');

  /* ===== 游戏状态（集中管理） ===== */
  const zbw511_state = {
    score: 0,
    timeLeft: zbw511_GAME_DURATION,
    isPlaying: false,
    bestScore: Number(localStorage.getItem(zbw511_BEST_SCORE_KEY)) || 0,
  };

  let zbw511_timerId = null;    // 倒计时定时器句柄
  let zbw511_isFlashing = false; // 闪烁进行中标志位

  /* ===== 渲染 ===== */
  function zbw511_formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return m + ':' + s;
  }

  function zbw511_renderScore() {
    zbw511_scoreValueEl.textContent = zbw511_state.score;
  }

  function zbw511_renderTimer() {
    zbw511_timerValueEl.textContent = zbw511_formatTime(zbw511_state.timeLeft);
  }

  /* ===== 小球生成 ===== */
  function zbw511_randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function zbw511_isOverlapping(pos, placed) {
    return placed.some(function (p) {
      const dx = p.x - pos.x;
      const dy = p.y - pos.y;
      // 球心距离需 > 直径，等于或小于即视为重叠（依据 spec §8）
      return Math.sqrt(dx * dx + dy * dy) <= zbw511_BALL_DIAMETER;
    });
  }

  // 在游戏区内随机取一个满足约束的球位（左上角坐标）
  function zbw511_getBallPosition(placed) {
    const maxX = Math.max(zbw511_EDGE_MARGIN, zbw511_ballsLayer.clientWidth - zbw511_BALL_DIAMETER - zbw511_EDGE_MARGIN);
    const maxY = Math.max(zbw511_EDGE_MARGIN, zbw511_ballsLayer.clientHeight - zbw511_BALL_DIAMETER - zbw511_EDGE_MARGIN);
    let pos = { x: zbw511_EDGE_MARGIN, y: zbw511_EDGE_MARGIN };

    for (let i = 0; i < zbw511_MAX_PLACEMENT_TRIES; i++) {
      pos = {
        x: zbw511_randomBetween(zbw511_EDGE_MARGIN, maxX),
        y: zbw511_randomBetween(zbw511_EDGE_MARGIN, maxY),
      };
      if (!zbw511_isOverlapping(pos, placed)) break;
    }
    // 尝试耗尽仍重叠时，返回最后候选作为兜底（极小窗口下允许轻微重叠）
    return pos;
  }

  function zbw511_createBalls() {
    zbw511_ballsLayer.innerHTML = '';
    const placed = [];
    for (let i = 0; i < zbw511_BALL_COUNT; i++) {
      const pos = zbw511_getBallPosition(placed);
      const ball = document.createElement('div');
      ball.className = 'zbw511_ball';
      ball.style.left = pos.x + 'px';
      ball.style.top = pos.y + 'px';
      zbw511_ballsLayer.appendChild(ball);
      placed.push(pos);
    }
  }

  /* ===== 命中后刷新小球 ===== */
  // 收集除指定球外其余球的当前坐标，供新位置避让使用
  function zbw511_collectOtherPositions(ball) {
    const placed = [];
    zbw511_ballsLayer.querySelectorAll('.zbw511_ball').forEach(function (el) {
      if (el !== ball) {
        placed.push({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) });
      }
    });
    return placed;
  }

  function zbw511_moveBallToRandomPosition(ball) {
    const pos = zbw511_getBallPosition(zbw511_collectOtherPositions(ball));
    ball.style.left = pos.x + 'px';
    ball.style.top = pos.y + 'px';
  }

  // 播放命中动画，动画结束后在新随机位置重现
  function zbw511_refreshBall(ball) {
    ball.classList.add(zbw511_BALL_HIT_CLASS);
    ball.addEventListener('animationend', function () {
      ball.classList.remove(zbw511_BALL_HIT_CLASS);
      zbw511_moveBallToRandomPosition(ball);
    }, { once: true });
  }

  /* ===== 反馈（飘字 / 闪烁） ===== */
  // 在点击坐标处生成一个上浮淡出的分数提示，动画结束后自动移除
  function zbw511_showFloatText(text, x, y, isHit) {
    const el = document.createElement('span');
    el.className = 'zbw511_float-text ' + (isHit ? zbw511_FLOAT_TEXT_HIT : zbw511_FLOAT_TEXT_MISS);
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    zbw511_gameAreaEl.appendChild(el);
    el.addEventListener('animationend', function () {
      el.remove();
    }, { once: true });
  }

  // 游戏区轻微闪烁，提示一次失误
  // 仅响应自身（非冒泡子元素）的动画结束事件，且用标志位保证同一时刻只挂一个监听，避免监听器堆积
  function zbw511_onAreaAnimationEnd(event) {
    if (event.target !== zbw511_gameAreaEl) return;
    zbw511_gameAreaEl.classList.remove(zbw511_GAME_AREA_FLASH_CLASS);
    zbw511_gameAreaEl.removeEventListener('animationend', zbw511_onAreaAnimationEnd);
    zbw511_isFlashing = false;
  }

  function zbw511_flashGameArea() {
    if (zbw511_isFlashing) return;
    zbw511_isFlashing = true;
    zbw511_gameAreaEl.classList.add(zbw511_GAME_AREA_FLASH_CLASS);
    zbw511_gameAreaEl.addEventListener('animationend', zbw511_onAreaAnimationEnd);
  }

  /* ===== 计分 ===== */
  function zbw511_addScore(delta) {
    zbw511_state.score += delta;
    zbw511_renderScore();
  }

  // 事件委托：只在游戏区上监听
  // 命中判据为 .zbw511_ball；空白判据为点击落在真正的游戏面 #zbw511_balls-layer 上，
  // 借此排除遮罩/结算面板/按钮（点击「再来一局」等不会误扣分，且顶部信息栏不在其内）
  function zbw511_getClickPoint(event) {
    const rect = zbw511_gameAreaEl.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function zbw511_handleAreaClick(event) {
    if (!zbw511_state.isPlaying) return;

    const ball = event.target.closest('.zbw511_ball');

    if (ball) {
      if (ball.classList.contains(zbw511_BALL_HIT_CLASS)) return; // 动画进行中，忽略重复点击
      zbw511_addScore(zbw511_SCORE_HIT);
      zbw511_refreshBall(ball);
      const point = zbw511_getClickPoint(event);
      zbw511_showFloatText('+' + zbw511_SCORE_HIT, point.x, point.y, true);
    } else if (event.target === zbw511_ballsLayer) {
      zbw511_addScore(zbw511_SCORE_MISS);
      const point = zbw511_getClickPoint(event);
      zbw511_showFloatText(String(zbw511_SCORE_MISS), point.x, point.y, false);
      zbw511_flashGameArea();
    }
  }

  /* ===== 倒计时 ===== */
  function zbw511_tick() {
    zbw511_state.timeLeft -= 1;
    zbw511_renderTimer();
    if (zbw511_state.timeLeft <= 0) {
      zbw511_endGame();
    }
  }

  function zbw511_startCountdown() {
    clearInterval(zbw511_timerId);
    zbw511_timerId = setInterval(zbw511_tick, 1000);
  }

  function zbw511_endGame() {
    clearInterval(zbw511_timerId);
    zbw511_timerId = null;
    zbw511_state.isPlaying = false;
    zbw511_updateBestScore();
    zbw511_showResultPanel();
  }

  // 结束后展示结算面板：本局得分 + 历史最高分
  function zbw511_showResultPanel() {
    zbw511_finalScoreEl.textContent = zbw511_state.score;
    zbw511_bestScoreEl.textContent = zbw511_state.bestScore;
    zbw511_startView.classList.add('zbw511_hidden');
    zbw511_resultPanel.classList.remove('zbw511_hidden');
    zbw511_overlay.classList.remove('zbw511_hidden');
  }

  // 用 localStorage 持久化历史最高分
  function zbw511_updateBestScore() {
    if (zbw511_state.score > zbw511_state.bestScore) {
      zbw511_state.bestScore = zbw511_state.score;
      localStorage.setItem(zbw511_BEST_SCORE_KEY, String(zbw511_state.bestScore));
    }
  }

  /* ===== 游戏流程 ===== */
  function zbw511_startGame() {
    zbw511_state.isPlaying = true;
    zbw511_startView.classList.remove('zbw511_hidden');
    zbw511_resultPanel.classList.add('zbw511_hidden');
    zbw511_overlay.classList.add('zbw511_hidden');
    zbw511_createBalls();
    zbw511_startCountdown();
  }

  function zbw511_resetGame() {
    clearInterval(zbw511_timerId);
    zbw511_timerId = null;
    zbw511_gameAreaEl.classList.remove(zbw511_GAME_AREA_FLASH_CLASS);
    zbw511_isFlashing = false;
    zbw511_state.score = 0;
    zbw511_state.timeLeft = zbw511_GAME_DURATION;
    zbw511_state.isPlaying = false;
    zbw511_ballsLayer.innerHTML = '';
    // 清理可能残留的分数飘字，保证重开后画面干净
    zbw511_gameAreaEl.querySelectorAll('.zbw511_float-text').forEach(function (el) {
      el.remove();
    });
    zbw511_renderScore();
    zbw511_renderTimer();
  }

  /* ===== 事件绑定 ===== */
  zbw511_startBtn.addEventListener('click', zbw511_startGame);
  zbw511_restartBtn.addEventListener('click', function () {
    zbw511_resetGame();
    zbw511_startGame();
  });
  zbw511_gameAreaEl.addEventListener('click', zbw511_handleAreaClick);

  /* ===== 初始化 ===== */
  zbw511_renderScore();
  zbw511_renderTimer();
})();
