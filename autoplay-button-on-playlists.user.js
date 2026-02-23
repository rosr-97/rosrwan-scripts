// ==UserScript==
// @name         Autoplay button on playlists
// @namespace    https://github.com/rosr-97/rosrwan-scripts
// @version      2026-02-21
// @description  Brings back the autoplay button into youtube playlists.
// @author       rosrwan
// @match        https://www.youtube.com/*
// @icon         https://icons.duckduckgo.com/ip2/youtube.com.ico
// @grant        GM_addStyle
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const css = ` 
    .html5-video-player.ended-mode .ytp-play-button.ytp-button svg path {
      d: path("M11.29 2.92C14.85 1.33 18.87 1.06 22.61 2.15L22.96 2.26C26.56 3.40 29.67 5.74 31.75 8.89L31.95 9.19C33.90 12.28 34.77 15.93 34.42 19.56L34.38 19.93C34.04 22.79 32.96 25.51 31.25 27.83C29.53 30.14 27.23 31.97 24.59 33.12C21.95 34.27 19.05 34.71 16.18 34.40C13.32 34.08 10.59 33.02 8.26 31.32L7.97 31.10C4.87 28.73 2.71 25.33 1.88 21.52L3.34 21.20L4.81 20.88C5.49 24.00 7.25 26.77 9.79 28.72L10.27 29.07C12.19 30.40 14.41 31.22 16.74 31.44C19.06 31.65 21.40 31.27 23.53 30.31C25.66 29.35 27.50 27.86 28.88 25.98C30.26 24.10 31.13 21.89 31.40 19.58L31.46 18.98C31.68 16.00 30.90 13.03 29.25 10.54C27.60 8.05 25.17 6.18 22.34 5.22L21.77 5.04C19.02 4.23 16.08 4.33 13.38 5.31C10.68 6.29 8.37 8.11 6.77 10.5H10.5L10.65 10.50C11.03 10.54 11.38 10.73 11.63 11.02C11.88 11.31 12.01 11.69 11.99 12.07C11.97 12.46 11.81 12.82 11.53 13.08C11.25 13.35 10.88 13.49 10.5 13.5H1.5V4.5L1.50 4.34C1.54 3.97 1.71 3.63 1.99 3.38C2.27 3.13 2.62 3.00 3 3.00C3.37 3.00 3.72 3.13 4.00 3.38C4.28 3.63 4.45 3.97 4.49 4.34L4.5 4.5V8.51C6.21 6.07 8.56 4.13 11.29 2.92ZM24 18L15 12.75V23.25L24 18ZM3.02 19.73C2.63 19.82 2.29 20.05 2.08 20.39C1.86 20.72 1.79 21.13 1.88 21.52L4.81 20.88C4.77 20.69 4.69 20.50 4.57 20.34C4.46 20.18 4.32 20.04 4.15 19.94C3.99 19.83 3.80 19.76 3.61 19.72C3.41 19.69 3.21 19.69 3.02 19.73Z");
    }

    a.ytp-next-button.ytp-button.ytp-playlist-ui,
    .ytp-button.ytp-autonav-toggle.delhi-fast-follow-autonav-toggle {
      display: inline-block !important;
    }

    .ytp-fullscreen-grid {
      display: block !important;
    }
  `;
  GM_addStyle(css);

  let interval = undefined;
  const ytdObserver = new MutationObserver((mutationsList, observer) => {
    clearInterval(interval);
    if ((/&list=/i.exec(location.search)?.length ?? 0) < 1) return;

    const ytdPlayer = document.body?.querySelector('ytd-player');
    if (!ytdPlayer) return;

    const adReference = ytdPlayer.querySelector('.ytp-ad-player-overlay-layout__ad-info-container');
    if (adReference) return;

    const video = ytdPlayer.querySelector("video");
    if (!video) return;

    const autoplay = ytdPlayer.querySelector(".ytp-button.ytp-autonav-toggle.delhi-fast-follow-autonav-toggle .ytp-autonav-toggle-button");
    if (!autoplay) return;

    const html5Player = ytdPlayer.querySelector('.html5-video-player');
    if (!html5Player) return;

    interval = setInterval(() => {
      const duration = video.duration || 1;
      const currentTime = video.currentTime || 0;
      if ((duration - 0.6) > currentTime) {
        !html5Player.classList.contains('ended-mode') || html5Player.classList.remove('ended-mode');
        return;
      }

      html5Player.classList.add('ytp-fullscreen-grid-active', 'ended-mode');
      html5Player.classList.remove('paused-mode', 'ytp-fullscreen-grid-peeking');
      if (video.paused) return;

      const isEnabled = autoplay.ariaChecked;
      if (isEnabled === 'true') return;

      video.pause();
      video.addEventListener('play', (event) => {
        if (!html5Player.classList.contains('ended-mode')) return;
        video.currentTime = 0;
      }, { once: true });
    }, 10);
  });

  new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (!mutation.target?.classList.contains('ytd-player')) continue;
      ytdObserver.observe(mutation.target, { childList: true, subtree: true });
      observer.disconnect();
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
