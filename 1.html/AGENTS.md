# AGENTS.md

## Structure
- Vanilla HTML/CSS/JS only (no build, no deps). Entry: `index.html` loads `style.css` and `script.js` (defer).
- Core files: `index.html`, `style.css`, `script.js`. `spec.md` is the requirement baseline (confirmed behavior). README files are Gitee templates.

## Run / verify
- Run by opening `index.html` directly in a desktop browser (Chrome/Edge/Firefox). No server/build needed.
- Manual verification only per `spec.md` acceptance criteria; no test runner/config present.

## Key implementation details
- ID/class prefix `zbw511_*` throughout (topbar `#zbw511_topbar`, game area `#zbw511_game-area`, balls layer `#zbw511_balls-layer`, overlay/result/start). 
- Ball diameter `60px` (`zbw511_BALL_DIAMETER` in JS, must match `.zbw511_ball` in CSS). 3 balls always on screen (`zbw511_BALL_COUNT=3`).
- Placement: balls fully inside game area with >=10px margin from edges/topbar; avoid overlap (distance > diameter). Falls back to last candidate if can't place (small window).
- Scoring: hit ball `+2`, click empty area of `#zbw511_balls-layer` `-1` (score can go negative). Clicking topbar does not deduct. Clicking during hit animation ignored.
- Timer 120s, updates every second; game ends at `00:00` (stops timer/clicks), shows result panel with final score and best score.
- Hit feedback: ball animates shrink/fade (`.zbw511_ball--hit`, 0.3s) then moves to new random position; `+2` float text at click. Miss: `-1` float text + game area flash (`.zbw511_game-area--flash`, 0.3s).
- Persistence: `localStorage` key `catchBallBestScore` (number). Best score only updated if current > best.
- Overlay: initial show start button; during play overlay hidden; on end show result panel. Hiding overlay uses `.zbw511_hidden` with high specificity for `#zbw511_overlay.zbw511_hidden { display: none; }`.
- Restart resets score/time/balls/float texts and restarts countdown.

## Gotchas
- Don't change ball size/id prefixes without updating both CSS and JS constants.
- Click handling is delegated to `#zbw511_game-area`; empty clicks only count if target is `#zbw511_balls-layer` (so overlay/buttons/topbar don't trigger miss). 
- Animation cleanup: hit uses `animationend` once to reposition; area flash uses flag + removes listener on end to avoid stacking.
- No audio, no mobile/touch, no pause/difficulty scaling per spec.
