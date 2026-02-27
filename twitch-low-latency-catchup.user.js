// ==UserScript==
// @name         Twitch Low Latency Catch-Up for FFZ
// @version      2026-02-27
// @description  Integration controller of the script 'Twitch Low Latency Catch-Up' for FrankerFaceZ.
// @author       rosrwan
// @namespace    https://github.com/rosr-97/rosrwan-scripts
// @match        https://www.twitch.tv/*
// @match        https://player.twitch.tv/*
// @grant        none
// @run-at       document-idle
// @icon         https://raw.githubusercontent.com/rosr-97/rosrwan-scripts/8e7678e34918c3e14780ee39c12f101cf2ba2f9c/assets/twitch-low-latency-catchup.png
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const metadata = {
    name: 'Low Latency Catch-Up',
    short_name: 'LowLatencyCatchUp',
    author: 'Mattskiiau',
    maintainer: 'rosrwan',
    description: 'Enjoy a smoother, truly live Twitch experience! This script intelligently manages playback speed to eliminate frustrating lag, keeping you in the moment. Comes with a simple on-screen menu to customize your settings.',
    version: '2026-02-27',
    website: 'https://greasyfork.org/users/1519406',
    enabled: true,
    requires: [],
    settings: 'add_ons.low_latency_catch_up',
    icon: 'https://raw.githubusercontent.com/rosr-97/rosrwan-scripts/8e7678e34918c3e14780ee39c12f101cf2ba2f9c/assets/twitch-low-latency-catchup.png'
  };

  new MutationObserver((mutationsList, observer) => {
    if (typeof FrankerFaceZ === 'undefined') return;
    if (!FrankerFaceZ.instance?.addons) return;
    FrankerFaceZ.instance.addons.on(':ready', addons_ready);
    observer.disconnect();
  }).observe(document.body, { childList: true, subtree: true });

  function addons_ready(event) {
    const { ManagedStyle } = FrankerFaceZ.utilities.dom;

    class TwitchLatencyCatchUp extends FrankerFaceZ.utilities.addon.Addon {
      constructor(...args) {
        super(...args);
        this.inject('settings');
        this.style = new ManagedStyle();
        this.style.set('default', '#llc30 { display: none; }');
        this.enable();
      }

      onEnable() {
        this.settings.add('low_latency_catch_up.enabled', {
          default: true,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General',
            title: 'Enabled',
            description: 'If enabled the script will try to catch up to the live stream.',
            component: 'setting-check-box'
          },
        });
        this.settings.getChanges('low_latency_catch_up.enabled',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="enabled"]');
            input.checked = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.targetLag', {
          default: 2.5,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General',
            title: 'Target Delay',
            description: 'The desired number of seconds you want to be behind the live stream.',
            component: 'setting-text-box',
            type: "number",
          },
        });
        this.settings.getChanges('low_latency_catch_up.targetLag',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="targetLag"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.maxBoost', {
          default: 1.03,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General',
            title: 'Speed Rate',
            description: 'The maximum speed the video will play at while catching up. A higher value means you will catch up faster, but it may be more noticeable.',
            component: 'setting-text-box',
            type: "number",
          },
        });
        this.settings.getChanges('low_latency_catch_up.maxBoost',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="maxBoost"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.rateStepUp', {
          default: 0.05,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Advanced Options',
            title: 'Rate Step Up',
            description: 'The maximum amount the playback speed can increase in a single step. Lowering this value results in a slower, smoother acceleration.',
            component: 'setting-text-box',
            type: "number",
          },
        });
        this.settings.getChanges('low_latency_catch_up.rateStepUp',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="rateStepUp"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.rateStepDown', {
          default: 0.05,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Advanced Options',
            title: 'Rate Step Down',
            description: 'The maximum amount the playback speed can decrease in a single step. Lowering this value results in a slower, smoother deceleration back to normal speed.',
            component: 'setting-text-box',
            type: "number",
          },
        });
        this.settings.getChanges('low_latency_catch_up.rateStepDown',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="rateStepDown"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.rateSmoothFactor', {
          default: 0.55,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Advanced Options',
            title: 'Rate Smooth Factor',
            description: 'A multiplier that affects how aggressively the script tries to reach the target speed. A higher value makes the speed changes more aggressive.',
            component: 'setting-text-box',
            type: "number",
          },
        });
        this.settings.getChanges('low_latency_catch_up.rateSmoothFactor',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="rateSmoothFactor"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.bufferSafety', {
          default: 1.5,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Advanced Options',
            title: 'Buffer Safety',
            description: 'The minimum number of seconds of video that must be buffered before the script is allowed to speed up.',
            component: 'setting-text-box',
            type: "number",
          },
        });
        this.settings.getChanges('low_latency_catch_up.bufferSafety',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="bufferSafety"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });
      }
    }

    TwitchLatencyCatchUp.register('low_latency_catch_up', metadata);
  }
})();