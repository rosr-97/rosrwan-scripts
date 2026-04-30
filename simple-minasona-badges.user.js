// ==UserScript==
// @name         Simple Minasona Badges for FFZ
// @namespace    https://github.com/rosr-97/rosrwan-scripts
// @description  Simple implementation of the minasona badges for FrankerFacez.
// @version      2026-29-04
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
    version: '1.0.0',
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

  /**
   * Called when the FrankerFaceZ addon is ready.
   */
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
        this.inject('site.router');

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
          .minasona-icon-container { 
            display: none; 
          }
          .ffz--tab-container .ffz--menu-container [for^="addon.minasona_twitch_extension.badge"] .ffz-badge.ffz-tooltip {
            background-size: contain; 
            background-repeat: no-repeat;
          }
        `);
        this.registerTemplate();

        this.chat.on(':receive-message', this.onReceiveMessage.bind(this));
        this.chat.on(':get-messages-late', this.onGetMessagesLate.bind(this));
        this.router.on(':route', this.updateBadges.bind(this));
      }

      onGetMessagesLate(instance) {
        for (const message of this.chat.iterateMessages())
          this.onReceiveMessage(message);
      }

      onReceiveMessage(instance) {
        if (!this.isEnabled) return;

        const isDawgsChannel = /^\/(cerbervt)$/i.test(location.pathname);
        if (!isDawgsChannel && !this.isEverywhere) return;

        const user = instance.message.user;
        this.registerUserBadge(user.id, `${user.login}`.toLocaleLowerCase());
      }

      registerTemplate() {
        const badgeId = `addon.${metadata.addon}.badge`;

        this.style.set(`template`, `
          .ffz--tab-container .ffz--menu-container [for^="addon.minasona_twitch_extension.badge"] .ffz-badge.ffz-tooltip[title="Minawan"]:first-child { display: none; }
        `);

        this.badges.loadBadgeData(badgeId, {
          base_id: badgeId,
          addon: metadata.addon,
          title: 'Minawan',
          image: metadata.icon,
          css: 'background-size: contain;background-repeat: no-repeat;',
        });
      }

      async registerUserBadge(userId, username) {
        const imageUrl = minasonas[username]?.imageUrl;
        const iconUrl = minasonas[username]?.iconUrl;
        const baseId = `addon.${metadata.addon}.badge`;
        const user = this.chat.getUser(userId);
        if (user.getBadge(baseId) !== null) return;

        const badgeId = `${baseId}-${userId}`;
        if (this.users.get(badgeId)) return;

        const minawan = /^([\d_]+)?([A-Za-z_]+?(wan))([\d_-]+)?$/i.exec(username)?.[2]?.replace(/[\d_-]+/i, '')
          ?? /([\w.-]+\/)(\w+)_(\d+)x(\d+)\.(\w+)/i.exec((imageUrl ?? iconUrl))?.[2]?.replace(/minasona/i, username);// guessing minawan name

        this.badges.loadBadgeData(badgeId, {// visual dummy
          base_id: baseId,
          addon: metadata.addon,
          title: 'Minawan',
          image: iconUrl ?? imageUrl,
          tooltipExtra: () => `\n(${`${minawan ?? username}`})`,
        });

        const options = {
          addon: metadata.addon,
          badge_id: badgeId,
          base_id: baseId,
          title: minawan ?? username,
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

        for (const message of this.chat.iterateMessages())
          this.onReceiveMessage(message);
      }
    }

    MinasonaTwitchExtension.register(metadata.addon, metadata);
  }
})();