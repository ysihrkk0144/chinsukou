const symbols = [
  "ち",
  "ん",
  "す",
  "こ",
  "う"
];

const reels = document.querySelectorAll(".reel");

const button = document.getElementById("startStopButton");


/* =========================
   設定
========================= */

const symbolHeight = 50;

/*
  1文字進む時間。

  数値を小さくすると速く、
  大きくすると遅くなる。
*/
const baseSpeed = 180;


/* =========================
   リール状態
========================= */

const reelStates = [];

let running = false;


/* =========================
   初期化
========================= */

reels.forEach((reel, reelNumber) => {

  /*
    リールを途切れなく回すため、
    同じ文字列を大量に並べる。
  */

  const repeatCount = 30;

  for (let i = 0; i < repeatCount; i++) {

    symbols.forEach(symbol => {

      const div = document.createElement("div");

      div.className = "symbol";
      div.textContent = symbol;

      reel.appendChild(div);

    });

  }


  /*
    各リールの初期位置を少しずらす
  */

  const initialIndex = reelNumber;

  const initialPosition =
    -(initialIndex * symbolHeight);

  reel.style.transform =
    `translateY(${initialPosition}px)`;


  reelStates.push({

    reel: reel,

    position: initialPosition,

    /*
      リールごとにほんの少しだけ
      スピードを変える。

      これによって5列が
      常に同じ文字になるのを防ぐ。
    */

    speed:
      baseSpeed +
      reelNumber * 13,

    lastTime: 0

  });

});


/* =========================
   START / STOP
========================= */

button.addEventListener("click", () => {

  if (running) {

    stopReels();

  } else {

    startReels();

  }

});


/* =========================
   START
========================= */

function startReels() {

  running = true;

  button.textContent = "STOP";

  reelStates.forEach(state => {

    state.lastTime = performance.now();

  });

  requestAnimationFrame(animateReels);

}


/* =========================
   STOP
========================= */

function stopReels() {

  running = false;

  button.textContent = "START";


  /*
    停止時に、一番近い文字位置へ
    ピタッと揃える。
  */

  reelStates.forEach(state => {

    state.position =
      Math.round(
        state.position / symbolHeight
      ) * symbolHeight;

    state.reel.style.transform =
      `translateY(${state.position}px)`;

  });

}


/* =========================
   リール回転
========================= */

function animateReels(currentTime) {

  if (!running) {
    return;
  }


  reelStates.forEach(state => {

    const deltaTime =
      currentTime - state.lastTime;

    state.lastTime = currentTime;


    /*
      下方向へ動かす
    */

    state.position +=
      state.speed *
      deltaTime /
      1000;


    /*
      一定位置まで進んだら
      元の位置へ戻す。

      見た目上は途切れない。
    */

    const cycleHeight =
      symbols.length *
      symbolHeight;

    if (state.position >= 0) {

      state.position -= cycleHeight;

    }


    state.reel.style.transform =
      `translateY(${state.position}px)`;

  });


  requestAnimationFrame(animateReels);

}