// ==UserScript==
// @name         Autoplay button on playlists
// @namespace    minawan
// @version      2026-02-13
// @description  Brings back the autoplay button into youtube playlists.
// @author       rosrwan
// @match        https://*.youtube.com/*
// @icon         https://icons.duckduckgo.com/ip2/youtube.com.ico
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  const css = `
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
      if ((duration - 0.6) > currentTime) return;

      html5Player.classList.add('ytp-fullscreen-grid-active', 'ended-mode');
      html5Player.classList.remove('paused-mode');
      if (video.paused) return;

      const isEnabled = autoplay.ariaChecked;
      if (isEnabled === 'true') return;

      video.pause();
    }, 10);
  });

  new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList)
    {
      if (!mutation.target?.classList.contains('ytd-player')) continue;
      ytdObserver.observe(mutation.target, { childList:true, subtree:true });
      observer.disconnect();
    }
  }).observe(document.body, { childList:true, subtree:true });
})();
