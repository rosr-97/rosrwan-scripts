// ==UserScript==
// @name         Noticeable FirstTimeChatter for FFZ
// @namespace    rosrwan
// @description  More visual elements for the FirstTimeChatter setting for trubbel's addon.
// @version      2025-10-17
// @author       rosrwan
// @match        https://www.twitch.tv/*
// @icon         https://assets.twitch.tv/assets/favicon-32-e29e246c157142c94346.png
// @grant        GM_addStyle
// @run-at       document-end
// @noframes
// ==/UserScript==

(function() {
  'use strict';

  const css = `
    :root {
      --ffz--ftc-highlight--ex: 200, 50, 200;
    }

    .chat-wysiwyg-input-box--allow-border-style {
      background-color: rgba(var(--ffz--ftc-highlight--ex), 0.12) !important;
    }

    .chat-wysiwyg-input-box--allow-border-style:not(:hover):not(:focus-within) {
      box-shadow: inset 0 0 0 var(--input-border-width-small) rgb(var(--ffz--ftc-highlight--ex)) !important;
    }

    .chat-wysiwyg-input__placeholder {
      visibility: hidden;
      display: flex;
    }

    .chat-wysiwyg-input__placeholder:after {
      content: 'Send first message';
      visibility: visible;
      position: absolute;
    }

    .chat-wysiwyg-input-box--allow-focus-style:focus-within {
      border-color: var(--color-border-input-focus) rgb(var(--ffz--ftc-highlight--ex)) !important;
      box-shadow: 0 0 0 var(--input-border-width-default) rgb(var(--ffz--ftc-highlight--ex)), inset 0 0 0 var(--input-border-width-default) rgb(var(--ffz--ftc-highlight--ex)) !important;
    }
  `;
  const styleNode = GM_addStyle('');

  new MutationObserver((mutationsList, observer) => {
    if (typeof FrankerFaceZ === 'undefined') return;
    if (!FrankerFaceZ.instance?.addons) return;
    FrankerFaceZ.instance.addons.on(':ready', addons_ready);
    observer.disconnect();
  }).observe(document.body, { childList:true, subtree:true });

  function addons_ready(event)
  {
    const isEnabled = FrankerFaceZ.instance.settings.get("addon.trubbel.channel.chat.ftc");
    if (!isEnabled) return;

    FrankerFaceZ.instance.children.chat.on(':get-messages-late', chatInput_style);

    const chatInput = FrankerFaceZ.instance.children.site.fine.define("chat-input");
    chatInput.on('mount', chatInput_style);
    chatInput.on('update', chatInput_style);
    chatInput.ready((cls, instances) => {
      for (const instance of instances)
        chatInput_style(instance);
    });
  }

  async function chatInput_style(instance)
  {
    styleNode.innerHTML = document.head.querySelectorAll('[id^=ffz--managed-style--]')?.values()
      .find(item => /chat-wysiwyg-input-box--allow-border-style:not\(:hover\):not\(:focus-within\)/i.exec(item.innerText)?.length > 0)
      ? css : null;
  }
})();