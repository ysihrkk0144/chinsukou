const symbols = [
  "ち",
  "ん",
  "す",
  "こ",
  "う"
];

const reels =
  document.querySelectorAll(".reel");

const button =
  document.getElementById(
    "startStopButton"
  );


/* =========================
   設定
========================= */

const symbolHeight = 50;


/*
  回転速度

  前回：
  320

  今回：
  430

  さらに速くしたい場合は
  480～520程度に変更。
*/
const baseSpeed = 430;


/*
  STOP後の減速時間
*/
const decelerationDuration = 520;


/*
  行き過ぎる量

  50 = 1文字分
*/
const overshootDistance = 18;


/*
  行き過ぎる時間
*/
const overshootDuration = 110;


/*
  戻って停止する時間
*/
const settleDuration = 140;


/* =========================
   状態
========================= */

const reelStates = [];

let running = false;

let phase = "idle";

/*
  phase

  idle
  running
  decelerating
  overshoot
  settling
*/


/* =========================
   初期化
========================= */

reels.forEach(
  (reel, reelNumber) => {

    const repeatCount = 40;

    for (
      let i = 0;
      i < repeatCount;
      i++
    ) {

      symbols.forEach(symbol => {

        const div =
          document.createElement("div");

        div.className = "symbol";

        div.textContent = symbol;

        reel.appendChild(div);

      });

    }


    /*
      初期表示

      ち
      ん
      す
      こ
      う

      と少しずつずらす
    */

    const initialIndex =
      reelNumber;

    const initialPosition =
      -(initialIndex * symbolHeight);


    reel.style.transform =
      `translateY(${initialPosition}px)`;


    const speed =
      baseSpeed +
      reelNumber * 17;


    reelStates.push({

      reel,

      position:
        initialPosition,

      speed,

      currentSpeed:
        speed,

      lastTime: 0,

      phaseStartTime: 0,

      phaseStartPosition: 0,

      targetPosition: 0,

      overshootPosition: 0,

      startSpeed: 0

    });


    updateSymbolAppearance(
      reelStates[
        reelStates.length - 1
      ]
    );

  }
);


/* =========================
   ボタン
========================= */

button.addEventListener(
  "click",
  () => {

    if (phase === "idle") {

      startReels();

      return;

    }


    if (phase === "running") {

      beginStop();

    }

  }
);


/* =========================
   START
========================= */

function startReels() {

  running = true;

  phase = "running";

  button.textContent = "STOP";

  button.disabled = false;


  const now =
    performance.now();


  reelStates.forEach(
    state => {

      state.currentSpeed =
        state.speed;

      state.lastTime =
        now;

    }
  );


  requestAnimationFrame(
    animateReels
  );

}


/* =========================
   STOP開始
========================= */

function beginStop() {

  phase = "decelerating";

  button.disabled = true;

  const now =
    performance.now();


  reelStates.forEach(
    state => {

      state.phaseStartTime =
        now;

      state.startSpeed =
        state.currentSpeed;

    }
  );

}


/* =========================
   減速終了
========================= */

function beginOvershoot(
  currentTime
) {

  phase = "overshoot";


  reelStates.forEach(
    state => {

      /*
        一番近い文字位置を
        最終停止位置にする
      */

      state.targetPosition =
        Math.round(
          state.position /
          symbolHeight
        ) *
        symbolHeight;


      /*
        一度少しだけ
        下へ行き過ぎる
      */

      state.overshootPosition =
        state.targetPosition +
        overshootDistance;


      state.phaseStartPosition =
        state.position;

      state.phaseStartTime =
        currentTime;

    }
  );

}


/* =========================
   戻り開始
========================= */

function beginSettling(
  currentTime
) {

  phase = "settling";


  reelStates.forEach(
    state => {

      state.phaseStartPosition =
        state.position;

      state.phaseStartTime =
        currentTime;

    }
  );

}


/* =========================
   完全停止
========================= */

function finishStop() {

  phase = "idle";

  running = false;


  reelStates.forEach(
    state => {

      state.position =
        state.targetPosition;

      renderReel(state);

    }
  );


  button.disabled = false;

  button.textContent = "START";

}


/* =========================
   メインアニメーション
========================= */

function animateReels(
  currentTime
) {

  if (!running) {
    return;
  }


  /*
    通常回転
  */

  if (phase === "running") {

    reelStates.forEach(
      state => {

        const delta =
          currentTime -
          state.lastTime;


        state.lastTime =
          currentTime;


        state.position +=
          state.currentSpeed *
          delta /
          1000;


        normalizePosition(
          state
        );


        renderReel(
          state
        );

      }
    );

  }


  /*
    減速
  */

  else if (
    phase === "decelerating"
  ) {

    let finished = true;


    reelStates.forEach(
      state => {

        const delta =
          currentTime -
          state.lastTime;


        state.lastTime =
          currentTime;


        const elapsed =
          currentTime -
          state.phaseStartTime;


        const progress =
          Math.min(
            elapsed /
            decelerationDuration,
            1
          );


        /*
          徐々に速度を落とす
        */

        const speedFactor =
          Math.pow(
            1 - progress,
            2
          );


        state.currentSpeed =
          state.startSpeed *
          speedFactor;


        state.position +=
          state.currentSpeed *
          delta /
          1000;


        normalizePosition(
          state
        );


        renderReel(
          state
        );


        if (progress < 1) {

          finished = false;

        }

      }
    );


    if (finished) {

      beginOvershoot(
        currentTime
      );

    }

  }


  /*
    少し行き過ぎる
  */

  else if (
    phase === "overshoot"
  ) {

    let finished = true;


    reelStates.forEach(
      state => {

        const elapsed =
          currentTime -
          state.phaseStartTime;


        const progress =
          Math.min(
            elapsed /
            overshootDuration,
            1
          );


        /*
          ease-out
        */

        const eased =
          1 -
          Math.pow(
            1 - progress,
            3
          );


        state.position =
          interpolate(
            state.phaseStartPosition,
            state.overshootPosition,
            eased
          );


        renderReel(
          state
        );


        if (progress < 1) {

          finished = false;

        }

      }
    );


    if (finished) {

      beginSettling(
        currentTime
      );

    }

  }


  /*
    少し戻って
    カチッと停止
  */

  else if (
    phase === "settling"
  ) {

    let finished = true;


    reelStates.forEach(
      state => {

        const elapsed =
          currentTime -
          state.phaseStartTime;


        const progress =
          Math.min(
            elapsed /
            settleDuration,
            1
          );


        /*
          戻りは
          少し弾力感を出す
        */

        const eased =
          1 -
          Math.pow(
            1 - progress,
            4
          );


        state.position =
          interpolate(
            state.phaseStartPosition,
            state.targetPosition,
            eased
          );


        renderReel(
          state
        );


        if (progress < 1) {

          finished = false;

        }

      }
    );


    if (finished) {

      finishStop();

      return;

    }

  }


  requestAnimationFrame(
    animateReels
  );

}


/* =========================
   リール描画
========================= */

function renderReel(
  state
) {

  state.reel.style.transform =
    `translateY(${state.position}px)`;


  updateSymbolAppearance(
    state
  );

}


/* =========================
   リール位置のループ
========================= */

function normalizePosition(
  state
) {

  const cycleHeight =
    symbols.length *
    symbolHeight;


  while (
    state.position >= 0
  ) {

    state.position -=
      cycleHeight;

  }


  /*
    長時間回しても
    数値が大きくなり過ぎないようにする
  */

  while (
    state.position <
    -cycleHeight * 4
  ) {

    state.position +=
      cycleHeight;

  }

}


/* =========================
   円筒感
========================= */

function updateSymbolAppearance(
  state
) {

  const elements =
    state.reel.children;


  /*
    リール窓の中央
  */
  const center = 75;


  for (
    let i = 0;
    i < elements.length;
    i++
  ) {

    const element =
      elements[i];


    const symbolCenter =
      state.position +
      i * symbolHeight +
      symbolHeight / 2;


    const distance =
      Math.abs(
        symbolCenter -
        center
      );


    const normalized =
      Math.min(
        distance / 75,
        1
      );


    /*
      中央：100%
      上下：80%程度
    */

    const scale =
      1 -
      normalized *
      0.20;


    /*
      上下は少し薄く
    */

    const opacity =
      1 -
      normalized *
      0.30;


    element.style.transform =
      `scale(${scale})`;

    element.style.opacity =
      opacity;

  }

}


/* =========================
   補間
========================= */

function interpolate(
  start,
  end,
  progress
) {

  return (
    start +
    (end - start) *
    progress
  );

}