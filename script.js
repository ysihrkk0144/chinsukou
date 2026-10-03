const symbols = [
  "ち",
  "ん",
  "す",
  "こ",
  "う"
];

const reels = document.querySelectorAll(".reel");

const button =
  document.getElementById("startStopButton");


/* =========================
   設定
========================= */

const symbolHeight = 50;

/*
  回転速度

  以前より速め。
  さらに速くしたい場合は
  320 → 360 などに変更。
*/
const baseSpeed = 320;

/*
  STOP後の減速時間
  単位：ミリ秒
*/
const decelerationDuration = 650;


/* =========================
   状態
========================= */

const reelStates = [];

let running = false;
let stopping = false;


/* =========================
   初期化
========================= */

reels.forEach((reel, reelNumber) => {

  const repeatCount = 40;

  for (let i = 0; i < repeatCount; i++) {

    symbols.forEach(symbol => {

      const div =
        document.createElement("div");

      div.className = "symbol";
      div.textContent = symbol;

      reel.appendChild(div);

    });

  }


  const initialIndex = reelNumber;

  const initialPosition =
    -(initialIndex * symbolHeight);

  reel.style.transform =
    `translateY(${initialPosition}px)`;


  reelStates.push({

    reel: reel,

    position: initialPosition,

    speed:
      baseSpeed +
      reelNumber * 16,

    currentSpeed:
      baseSpeed +
      reelNumber * 16,

    lastTime: 0,

    stopStartTime: 0,

    stopStartSpeed: 0

  });

});


/* =========================
   ボタン
========================= */

button.addEventListener("click", () => {

  if (stopping) {
    return;
  }

  if (running) {
    beginStop();
  } else {
    startReels();
  }

});


/* =========================
   START
========================= */

function startReels() {

  running = true;
  stopping = false;

  button.textContent = "STOP";

  const now = performance.now();

  reelStates.forEach(state => {

    state.currentSpeed =
      state.speed;

    state.lastTime = now;

  });

  requestAnimationFrame(animateReels);

}


/* =========================
   STOP開始
========================= */

function beginStop() {

  stopping = true;

  button.disabled = true;

  const now = performance.now();

  reelStates.forEach(state => {

    state.stopStartTime = now;

    state.stopStartSpeed =
      state.currentSpeed;

  });

}


/* =========================
   最終停止
========================= */

function finishStop() {

  running = false;
  stopping = false;

  button.disabled = false;
  button.textContent = "START";


  reelStates.forEach(state => {

    /*
      最も近い文字位置へ
      カチッと合わせる
    */

    state.position =
      Math.round(
        state.position / symbolHeight
      ) * symbolHeight;

    state.reel.style.transform =
      `translateY(${state.position}px)`;

  });

}


/* =========================
   アニメーション
========================= */

function animateReels(currentTime) {

  if (!running) {
    return;
  }

  let allStopped = true;


  reelStates.forEach(state => {

    const deltaTime =
      currentTime - state.lastTime;

    state.lastTime = currentTime;


    /*
      STOP中なら減速
    */

    if (stopping) {

      const elapsed =
        currentTime -
        state.stopStartTime;

      const progress =
        Math.min(
          elapsed /
          decelerationDuration,
          1
        );


      /*
        easeOutCubic

        最初はしっかり回り、
        後半でゆっくりになる
      */

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );


      state.currentSpeed =
        state.stopStartSpeed *
        (1 - eased);


      if (progress < 1) {
        allStopped = false;
      }

    } else {

      allStopped = false;

    }


    /*
      上 → 下へ回転
    */

    state.position +=
      state.currentSpeed *
      deltaTime /
      1000;


    /*
      ループ処理
    */

    const cycleHeight =
      symbols.length *
      symbolHeight;

    if (state.position >= 0) {

      state.position -=
        cycleHeight;

    }


    state.reel.style.transform =
      `translateY(${state.position}px)`;


    /*
      立体感
    */

    updateSymbolAppearance(state);

  });


  if (stopping && allStopped) {

    finishStop();

    return;

  }


  requestAnimationFrame(animateReels);

}


/* =========================
   円筒っぽい見た目
========================= */

function updateSymbolAppearance(state) {

  const symbolElements =
    state.reel.children;

  const reelTop =
    state.position;


  for (
    let i = 0;
    i < symbolElements.length;
    i++
  ) {

    const symbol =
      symbolElements[i];


    /*
      各文字の中心位置
    */

    const symbolCenter =
      reelTop +
      i * symbolHeight +
      symbolHeight / 2;


    /*
      リール窓中央は75px
    */

    const distance =
      Math.abs(
        symbolCenter - 75
      );


    /*
      中央ほど大きく、
      上下ほど小さくする
    */

    const normalized =
      Math.min(
        distance / 75,
        1
      );


    const scale =
      1 - normalized * 0.22;


    const opacity =
      1 - normalized * 0.55;


    symbol.style.transform =
      `scale(${scale})`;

    symbol.style.opacity =
      opacity;

  }

}