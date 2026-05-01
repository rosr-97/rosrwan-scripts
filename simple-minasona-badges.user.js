// ==UserScript==
// @name         Simple Minasona Badges for FFZ
// @namespace    https://github.com/rosr-97/rosrwan-scripts
// @description  Simple implementation of the minasona badges for FrankerFacez.
// @version      2026-05-10
// @author       rosrwan
// @match        https://www.twitch.tv/*
// @icon         https://raw.githubusercontent.com/rosr-97/rosrwan-scripts/c5fd583eda27c2250aeebb305571b4727a069faf/assets/Minawan_Purple.png
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @noframes
// ==/UserScript==

(function () {
  new MutationObserver((mutationsList, observer) => {
    if (typeof FrankerFaceZ === 'undefined') return;
    if (!FrankerFaceZ.instance?.addons) return;
    FrankerFaceZ.instance.addons.on(':ready', addons_ready);
    observer.disconnect();
  }).observe(document.body, { childList: true, subtree: true });

  const minasonas = {};
  GM_xmlhttpRequest({
    method: "GET",
    url: "https://storage.googleapis.com/minawan-pics.firebasestorage.app/api.json",
    onload: res => {
      const data = JSON.parse(res.responseText);

      for (const [communityName, members] of Object.entries(data)) {
        if (communityName !== "cerbervt") continue;

        for (const member of members) {
          if (!member.twitchUsername) continue;

          const userName = member.twitchUsername.toLowerCase();
          if (!minasonas[userName])
            minasonas[userName] = {};

          minasonas[userName] = {
            iconUrl: encodeURI(member.avif64 || ""),
            imageUrl: encodeURI(member.avif256 || ""),
          };
        }
      }
    },
    onerror: err => console.error(err)
  });

  const metadata = {
    name: 'Simple Minasona Badges',
    description: 'Displays the minasona badge that corresponds to minawan.',
    version: '1.0.1',
    author: "rosrwan",
    maintainer: "rosrwan",
    short_name: 'Minasona Badges',
    website: 'https://github.com/rosr-97/rosrwan-scripts',
    enabled: true,
    requires: [],
    settings: 'add_ons.simple_minasona_badges',
    icon: 'https://raw.githubusercontent.com/rosr-97/rosrwan-scripts/c5fd583eda27c2250aeebb305571b4727a069faf/assets/Minawan_Purple.png',
    addon: 'simple_minasona_badges',
  };

  function addons_ready(event) {
    const { ManagedStyle } = FrankerFaceZ.utilities.dom;

    class MinasonaTwitchExtension extends FrankerFaceZ.utilities.addon.Addon {
      get isEnabled() {
        return this.settings.get(`${metadata.addon}.enabled`);
      }

      get isEverywhere() {
        return this.settings.get(`${metadata.addon}.everywhere`);
      }

      constructor(...args) {
        super(...args);

        this.inject('chat');
        this.inject('chat.badges');
        this.inject('site');
        this.inject('site.router');
        this.inject('site.fine');

        this.ChatLine = this.fine.define(
          "chat-line",
          n => n.onExtensionMessageClick || (n.props && n.props.message && n.props?.message?.user),
          this.site.constructor.CHAT_ROUTES
        );

        this.VideoChatLine = this.fine.define(
          'video-chat-line',
          n => n.onTimestampClickHandler && n.props?.messageContext?.author,
          ['user-video', 'user-clip', 'video']
        );

        this.users = new Map();
        this.style = new ManagedStyle();

        this.onRegisterSettings();
        this.enable();
      }

      onRegisterSettings() {
        this.settings.add(`${metadata.addon}.enabled`, {
          default: true,
          ui: {
            path: 'Add-Ons > Simple Minasona Badges >> General',
            title: 'Enable Badges',
            description: 'Show all available Minasona user badges.',
            component: 'setting-check-box',
          },
          changed: (val) => this.updateBadges(),
        });

        this.settings.add(`${metadata.addon}.everywhere`, {
          default: false,
          ui: {
            path: 'Add-Ons > Simple Minasona Badges >> General',
            title: 'Enable Everywhere',
            description: 'Show Minasonas in all chats.',
            component: 'setting-check-box',
          },
          changed: (val) => this.updateBadges(),
        });
      }

      onEnable() {
        this.style.set('default', `
          .ffz--tab-container .ffz--menu-container li:has(> [id="addon.${metadata.addon}.badge"]) {
            width: 100% !important;
          }
          
          .ffz--tab-container .ffz--menu-container [for="addon.${metadata.addon}.badge"] .ffz-badge.ffz-tooltip {
            background-size: contain;
            background-repeat: no-repeat;
          }
            
          .ffz--tab-container .ffz--menu-container [for="addon.${metadata.addon}.badge"] .ffz-badge.ffz-tooltip[title="Minawan"]:first-child { 
            display: none; 
          }
        `);

        this.badges.loadBadgeData(`addon.${metadata.addon}.badge`, {
          base_id: `addon.${metadata.addon}.badge`,
          addon: metadata.addon,
          title: 'Minawan',
          image: metadata.icon,
          css: 'background-size: contain;background-repeat: no-repeat;',
          click_url: 'https://minawan.me/gallery/',
        });

        this.ChatLine.on("update", this.onChatLineWrapper.bind(this));
        this.ChatLine.on("mount", this.onChatLineWrapper.bind(this));
        this.VideoChatLine.on("update", this.onChatLineWrapper.bind(this));
        this.VideoChatLine.on("mount", this.onChatLineWrapper.bind(this));
        this.router.on(':route', this.updateBadges.bind(this));
      }

      onChatLineWrapper(instance) {
        if (!this.isEnabled) return;

        const isDawgsChannel = /^\/(cerbervt)$/i.test(location.pathname);
        if (!isDawgsChannel && !this.isEverywhere) return;

        const user = instance.props.message?.user ?? instance.props.messageContext?.author;
        this.registerUserBadge(user.id, user.displayName);
      }

      async registerUserBadge(userId, displayName) {
        const minaKey = `${displayName}`.toLowerCase();
        if (minasonas[minaKey] === undefined) return;

        const imageUrl = minasonas[minaKey]?.imageUrl;
        const iconUrl = minasonas[minaKey]?.iconUrl;
        const baseId = `addon.${metadata.addon}.badge`;
        const user = this.chat.getUser(userId);
        if (user.getBadge(baseId) !== null) return;

        const badgeId = `${baseId}-${userId}`;
        if (this.users.get(badgeId)) return;

        const minawan = /^([\d_]+)?([A-Za-z_]+?(wan))([\d_-]+)?$/i.exec(displayName)?.[2]?.replace(/[\d_-]+/i, '')
          ?? /([\w.-]+\/)(\w+)_(\d+)x(\d+)\.(\w+)/i.exec((imageUrl ?? iconUrl))?.[2]?.replace(/minasona/i, displayName);// guessing minawan name

        this.badges.loadBadgeData(badgeId, {// visual dummy
          base_id: baseId,
          addon: metadata.addon,
          title: 'Minawan',
          image: iconUrl ?? imageUrl,
          tooltipExtra: () => `\n(${minawan ?? displayName})`,
        });

        const options = {
          addon: metadata.addon,
          badge_id: badgeId,
          base_id: baseId,
          title: minawan ?? displayName,
          slot: 111,
          image: imageUrl,
          urls: {
            1: iconUrl,
            2: iconUrl,
            4: imageUrl,
          }
        };

        this.users.set(badgeId, options);

        user.addBadge(`addon.${metadata.addon}`, baseId, options);
        this.emit('chat:update-lines-by-user', userId);
      }

      async updateBadges() {
        for (const user of this.chat.iterateUsers())
          user.removeAllBadges(`addon.${metadata.addon}`);

        for (const [badgeId, { badge_id }] of this.users)
          this.badges.removeBadge(badge_id);

        this.users.clear();
        this.emit('chat:update-lines');
      }
    }

    MinasonaTwitchExtension.register(metadata.addon, metadata);
  }
})();