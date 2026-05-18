// ==UserScript==
// @name         Twitch Low Latency Catch-Up for FFZ
// @version      2026-05-19
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
    description: 'Enjoy a smoother, truly live Twitch experience! This script intelligently manages playback speed to eliminate frustrating lag, keeping you in the moment.',
    version: '1.1.0',
    website: 'https://github.com/rosr-97/rosrwan-scripts',
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
        this.inject('site.router');
        this.inject('site.player');

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
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 2.5;
              const value = number <= 0 ? 0 : number;
              return `${value}`;
            },
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
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 1.03;
              const value = number <= 1 ? 1 : number >= 5 ? 5 : number;
              return `${value}`;
            },
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
            path: 'Add-Ons > Low Latency Catch-Up >> General > Options',
            title: 'Rate Step Up',
            description: 'The maximum amount the playback speed can increase in a single step. Lowering this value results in a slower, smoother acceleration.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 0.05;
              const value = number <= 0.01 ? 0.01 : number >= 1 ? 1 : number;
              return `${value}`;
            },
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
            path: 'Add-Ons > Low Latency Catch-Up >> General > Options',
            title: 'Rate Step Down',
            description: 'The maximum amount the playback speed can decrease in a single step. Lowering this value results in a slower, smoother deceleration back to normal speed.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 0.05;
              const value = number <= 0.01 ? 0.01 : number >= 1 ? 1 : number;
              return `${value}`;
            },
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
            path: 'Add-Ons > Low Latency Catch-Up >> General > Options',
            title: 'Rate Smooth Factor',
            description: 'A multiplier that affects how aggressively the script tries to reach the target speed. A higher value makes the speed changes more aggressive.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 0.55;
              const value = number <= 0.01 ? 0.01 : number >= 1 ? 1 : number;
              return `${value}`;
            },
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
            path: 'Add-Ons > Low Latency Catch-Up >> General > Options',
            title: 'Buffer Safety',
            description: 'The minimum number of seconds of video that must be buffered before the script is allowed to speed up.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 1.5;
              const value = number <= 0 ? 0 : number >= 10 ? 10 : number;
              return `${value}`;
            },
          },
        });
        this.settings.getChanges('low_latency_catch_up.bufferSafety',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="bufferSafety"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.seekCatchup', {
          default: true,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Seek Catchup',
            title: 'Allow Seek Catchup',
            description: 'Jump forward when latency is too high for playback speed alone.',
            component: 'setting-check-box'
          },
        });
        this.settings.getChanges('low_latency_catch_up.seekCatchup',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="seekCatchup"]');
            input.checked = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.seekTriggerLag', {
          default: 8.0,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Seek Catchup',
            title: 'Seek Trigger Lag',
            description: 'Latency where jump catch-up is allowed.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 8.0;
              const value = number <= 1 ? 1 : number >= 60 ? 60 : number;
              return `${value}`;
            },
          },
        });
        this.settings.getChanges('low_latency_catch_up.seekTriggerLag',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="seekTriggerLag"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.seekCooldownMs', {
          default: 12000,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Seek Catchup',
            title: 'Seek Cooldown Ms',
            description: 'Minimum time between jump catch-ups.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 12000;
              const value = number <= 1000 ? 1000 : number >= 30000 ? 30000 : number;
              return `${value}`;
            },
          },
        });
        this.settings.getChanges('low_latency_catch_up.seekCooldownMs',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="seekCooldownMs"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.seekLandingBuffer', {
          default: 4.0,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Seek Catchup',
            title: 'Seek Landing Buffer',
            description: 'Buffered video kept after a jump to avoid stutter.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 4.0;
              const value = number <= 1 ? 1 : number >= 15 ? 15 : number;
              return `${value}`;
            },
          },
        });
        this.settings.getChanges('low_latency_catch_up.seekLandingBuffer',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="seekLandingBuffer"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.settings.add('low_latency_catch_up.stallCooldownMs', {
          default: 8000,
          ui: {
            path: 'Add-Ons > Low Latency Catch-Up >> General > Seek Catchup',
            title: 'Stall Cooldown Ms',
            description: 'Catch-up pause after Twitch reports buffering.',
            component: 'setting-text-box',
            type: "number",
            process: (newVal, _oldVal) => {
              const number = Number(newVal) || Number(_oldVal) || 8000;
              const value = number <= 1000 ? 1000 : number >= 30000 ? 30000 : number;
              return `${value}`;
            },
          },
        });
        this.settings.getChanges('low_latency_catch_up.stallCooldownMs',
          (val) => {
            const input = document.querySelector('#llc30 [data-key="stallCooldownMs"]');
            input.value = val;
            input.dispatchEvent(new InputEvent('input'));
          });

        this.player.on(':update-gui', this.router_route.bind(this));
        this.router.on(':route', this.router_route.bind(this));
        this.router_route.bind(this)();
      }

      router_route(instance) {
        const input = document.querySelector('#llc30 [data-key="enabled"]');
        const isRewind = document.querySelector('[data-a-target="video-ref"] .video-player__overlay .player-controls [aria-label="Skip to Live"]');
        const isLive = /^\/(\w+)$/i.test(location.pathname);
        const canCatchUp = isLive && !isRewind
          && this.settings.get('low_latency_catch_up.enabled');

        if (input.checked === canCatchUp) return;
        input.checked = canCatchUp;
        input.dispatchEvent(new InputEvent('input'));
      }
    }

    TwitchLatencyCatchUp.register('low_latency_catch_up', metadata);
  }
})();