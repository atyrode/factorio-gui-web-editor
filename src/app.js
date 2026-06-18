/* global document, window */
(function () {
  "use strict";

  const model = window.FACTORIO_GUI_WEB_EDITOR_MODEL || window.TURRET_XP_GUI_FIXTURES;
  if (!model) {
    throw new Error("Missing FACTORIO_GUI_WEB_EDITOR_MODEL fixture data.");
  }
  const fixtures = model.fixtures;
  const fixtureById = Object.fromEntries(fixtures.map((fixture) => [fixture.id, fixture]));
  const roleById = Object.fromEntries(model.roleChoices.map((role) => [role.id, role]));

  const root = document.getElementById("prototype-root");
  const fixtureList = document.getElementById("fixture-list");

  const state = {
    fixtureId: model.defaultFixtureId || fixtures[0].id,
    source: "inventory",
    filter: "all",
    sort: "level",
    sortDir: "desc",
    mode: "live",
    followBuild: false,
    detailsOpen: false,
    coreDetailsOpen: false,
    live: null,
    plan: null
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentFixture() {
    return fixtureById[state.fixtureId];
  }

  function loadFixture(id) {
    const fixture = fixtureById[id];
    state.fixtureId = id;
    state.source = "inventory";
    state.filter = "all";
    state.sort = "level";
    state.sortDir = "desc";
    state.mode = fixture.mode || "live";
    state.followBuild = false;
    state.detailsOpen = false;
    state.coreDetailsOpen = false;
    state.live = clone(fixture.live || {});
    state.plan = clone(fixture.plan || fixture.live || {});
  }

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === false || value === null || value === undefined) {
        return;
      }
      if (key === "class") {
        node.className = value;
      } else if (key === "text") {
        node.textContent = value;
      } else if (key === "html") {
        node.innerHTML = value;
      } else if (key.startsWith("data")) {
        node.setAttribute(key.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase()), value);
      } else if (key.startsWith("aria")) {
        node.setAttribute(key.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase()), value);
      } else if (key === "disabled") {
        node.disabled = Boolean(value);
      } else {
        node.setAttribute(key, value);
      }
    });
    children.flat().forEach((child) => {
      if (child === null || child === undefined || child === false) {
        return;
      }
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function button(label, action, extra) {
    return h("button", {
      class: "fx-button " + (extra && extra.class ? extra.class : ""),
      dataAction: action,
      dataId: extra && extra.id,
      dataValue: extra && extra.value,
      dataDelta: extra && extra.delta,
      dataKind: extra && extra.kind,
      disabled: extra && extra.disabled
    }, label);
  }

  function section(title, anchor, children) {
    return h("section", { class: "fx-section", dataAnchor: anchor },
      h("div", { class: "fx-section__title" }, title),
      h("div", { class: "fx-section__body" }, children)
    );
  }

  function coreIcon() {
    return h("div", { class: "fx-core-icon", ariaLabel: "Veteran Core" },
      h("span", { class: "fx-core-icon__trace fx-core-icon__trace--a" }),
      h("span", { class: "fx-core-icon__trace fx-core-icon__trace--b" }),
      h("span", { class: "fx-core-icon__trace fx-core-icon__trace--c" })
    );
  }

  function smallIcon(type) {
    return h("span", { class: "fx-row-icon fx-row-icon--" + type, ariaHidden: "true" });
  }

  function fmt(value, suffix) {
    return String(value) + (suffix || "");
  }

  function addPct(value, pct) {
    return value * (1 + pct / 100);
  }

  function getProfile(kind) {
    return kind === "plan" ? state.plan : state.live;
  }

  function totalCoreSpent(profile) {
    return Object.values(profile.upgrades || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function totalAugmentSpent(profile) {
    return Object.values(profile.augments || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function calcStats(profile) {
    const upgrades = profile.upgrades || {};
    const role = roleById[profile.role || "none"] || roleById.none;
    const mods = role.modifiers || {};

    let damage = 8 + (upgrades.damage || 0) * 0.5;
    let speed = 25;
    let range = 18;
    let hp = 400;
    let resistance = (upgrades.resistance || 0) * 0.25;
    let shield = (upgrades.shield || 0) * 10;
    let productivity = (upgrades.productivity || 0) + (mods.productivityPct || 0);
    let critChance = (upgrades.critChance || 0) * 0.25;
    let critDamage = 50 + (upgrades.critDamage || 0) + (mods.critDamagePct || 0);

    damage = addPct(damage, mods.damagePct || 0);
    speed = addPct(speed, mods.speedPct || 0);
    range = addPct(range, mods.rangePct || 0);
    hp = addPct(hp, mods.hpPct || 0);
    resistance += mods.resistancePct || 0;

    const critMultiplier = 1 + (critChance / 100) * (critDamage / 100);
    const dps = damage * speed * critMultiplier;

    return {
      damage,
      speed,
      range,
      hp,
      resistance,
      shield,
      productivity,
      critChance,
      critDamage,
      dps
    };
  }

  function statText(key, stats) {
    const map = {
      damage: stats.damage.toFixed(1) + " / shot",
      dps: stats.dps.toFixed(0) + " / sec",
      speed: stats.speed.toFixed(1) + " / sec",
      range: stats.range.toFixed(0),
      hp: stats.hp.toFixed(0),
      shield: stats.shield.toFixed(0),
      resistance: stats.resistance.toFixed(1) + "%",
      crit: stats.critChance.toFixed(1) + "% / " + stats.critDamage.toFixed(0) + "%",
      ammo: "+" + stats.productivity.toFixed(0) + "% productivity"
    };
    return map[key];
  }

  function deltaClass(key, live, plan) {
    const delta = plan[key] - live[key];
    if (Math.abs(delta) < 0.01) {
      return "fx-delta fx-delta--same";
    }
    const harmfulWhenLower = ["damage", "dps", "speed", "range", "hp", "shield", "resistance"];
    const good = harmfulWhenLower.includes(key) ? delta > 0 : delta >= 0;
    return "fx-delta " + (good ? "fx-delta--good" : "fx-delta--bad");
  }

  function renderFixtureList() {
    fixtureList.replaceChildren(...fixtures.map((fixture) => {
      const selected = fixture.id === state.fixtureId;
      return h("button", {
        class: "fx-fixture " + (selected ? "is-active" : ""),
        dataAction: "set-fixture",
        dataId: fixture.id
      },
      h("span", { class: "fx-fixture__title" }, fixture.title),
      h("span", { class: "fx-fixture__meta" }, fixture.screen === "picker" ? "Core Picker" : "Workbench"));
    }));
  }

  function render() {
    renderFixtureList();
    const fixture = currentFixture();
    if (fixture.screen === "picker") {
      root.replaceChildren(renderPicker(fixture));
    } else {
      root.replaceChildren(renderWorkbench(fixture));
    }
  }

  function renderWindow(title, child) {
    return h("div", { class: "fx-window" },
      h("div", { class: "fx-window__titlebar" },
        h("strong", {}, title),
        h("div", { class: "fx-grip", ariaHidden: "true" })
      ),
      h("div", { class: "fx-window__body" }, child)
    );
  }

  function filterRows(rows) {
    if (state.filter === "all") {
      return rows;
    }
    if (state.filter === "base") {
      return rows.filter((row) => row.role === "None");
    }
    return rows.filter((row) => row.role.toLowerCase().replaceAll(" ", "") === state.filter);
  }

  function sortRows(rows) {
    const sorted = rows.slice().sort((a, b) => {
      const av = a[state.sort];
      const bv = b[state.sort];
      if (typeof av === "number" && typeof bv === "number") {
        return av - bv;
      }
      return String(av).localeCompare(String(bv));
    });
    return state.sortDir === "asc" ? sorted : sorted.reverse();
  }

  function renderPicker(fixture) {
    const sources = fixture.picker.sources;
    const hasPlatform = (sources.platform || []).length > 0;
    if (!hasPlatform && state.source === "platform") {
      state.source = "inventory";
    }
    const rows = sortRows(filterRows(sources[state.source] || []));
    const allCount = (sources.inventory || []).length + (sources.platform || []).length;

    return renderWindow(model.projectName || "Factorio GUI",
      h("div", { class: "fx-picker", dataAnchor: "turret_xp_core_picker" },
        h("header", { class: "fx-subpanel fx-picker__header", dataAnchor: "turret_xp_core_picker_header" },
          h("div", { class: "fx-slot" }, coreIcon()),
          h("div", {},
            h("h1", {}, "Install Veteran Core"),
            h("p", {}, "Choose a carried or platform core for this turret."),
            h("span", { class: "fx-muted" }, fixture.copiedTarget)
          ),
          h("strong", { class: "fx-count" }, String(allCount) + " available")
        ),
        h("div", { class: "fx-toolbar", dataAnchor: "turret_xp_core_picker_source" },
          button("Inventory", "set-source", { value: "inventory", class: state.source === "inventory" ? "is-active" : "" }),
          button("Platform", "set-source", { value: "platform", class: state.source === "platform" ? "is-active" : "", disabled: !hasPlatform })
        ),
        h("div", { class: "fx-toolbar fx-toolbar--dense", dataAnchor: "turret_xp_core_picker_filter_sort" },
          ["all", "base", "sniper", "machinegun", "bulwark", "brawler"].map((filter) => {
            const label = {
              all: "All",
              base: "Base",
              sniper: "Sniper",
              machinegun: "Machine gun",
              bulwark: "Bulwark",
              brawler: "Brawler"
            }[filter];
            return button(label, "set-filter", { value: filter, class: state.filter === filter ? "is-active" : "" });
          }),
          h("span", { class: "fx-toolbar__spacer" }),
          ["level", "name", "role", "hp", "range"].map((sort) => {
            const label = sort[0].toUpperCase() + sort.slice(1);
            const active = state.sort === sort;
            return button(label + (active ? " " + state.sortDir : ""), "set-sort", { value: sort, class: active ? "is-active" : "" });
          })
        ),
        h("div", { class: "fx-table-wrap", dataAnchor: "turret_xp_core_picker_table" },
          rows.length === 0
            ? h("div", { class: "fx-empty", dataAnchor: "turret_xp_core_picker_empty_state" },
              "No Veteran Core matches " + state.source + " / " + state.filter + ".")
            : h("table", { class: "fx-table" },
              h("thead", {},
                h("tr", {},
                  ["Core", "Level", "Name", "Role", "HP", "Attack", "Range", ""].map((label) => h("th", {}, label))
                )
              ),
              h("tbody", {}, rows.map((row) => h("tr", {},
                h("td", {}, h("div", { class: "fx-slot fx-slot--small" }, coreIcon())),
                h("td", {}, String(row.level)),
                h("td", {}, row.name),
                h("td", {}, row.role),
                h("td", {}, String(row.hp)),
                h("td", {}, row.attack),
                h("td", {}, String(row.range)),
                h("td", {}, button("Install", "install-core", { class: "fx-button--primary" }))
              )))
            )
        )
      )
    );
  }

  function renderWorkbench(fixture) {
    const liveStats = calcStats(state.live);
    const planStats = calcStats(state.plan);
    const activeKind = state.mode === "build" ? "plan" : "live";

    return renderWindow(model.projectName || "Factorio GUI",
      h("div", { class: "fx-workbench", dataAnchor: "turret_xp_installed_workbench" },
        renderWorkbenchHeader(fixture, liveStats),
        renderModeBar(fixture),
        h("div", { class: "fx-workbench__grid" },
          renderProgressionEditor(fixture, activeKind),
          renderStatInspector(liveStats, planStats)
        ),
        state.detailsOpen ? renderDetailDrawer(liveStats, planStats) : "",
        state.coreDetailsOpen ? renderCoreDetailsDrawer(fixture) : ""
      )
    );
  }

  function renderWorkbenchHeader(fixture, stats) {
    const core = fixture.core;
    const xpPct = Math.max(0, Math.min(100, (core.xp / core.xpNext) * 100));
    const liveCoreLeft = Math.max(0, fixture.budgets.core - totalCoreSpent(state.live));
    const planCoreLeft = Math.max(0, fixture.budgets.core - totalCoreSpent(state.plan));
    const liveAugLeft = Math.max(0, fixture.budgets.augment - totalAugmentSpent(state.live));
    const planAugLeft = Math.max(0, fixture.budgets.augment - totalAugmentSpent(state.plan));

    return h("header", { class: "fx-subpanel fx-workbench__header", dataAnchor: "turret_xp_workbench_header" },
      h("div", { class: "fx-slot", dataAnchor: "turret_xp_core_slot" }, coreIcon()),
      h("div", { class: "fx-header-main" },
        h("div", { class: "fx-header-main__top" },
          h("div", {},
            h("h1", {}, core.name),
            h("p", {}, "Level " + core.level + " - " + core.status)
          ),
          h("div", { class: "fx-header-actions" },
            button("Details", "toggle-drawer", { value: "core" }),
            button(core.bound ? "Unbind" : "Bind", "noop"),
            button("Extract", "noop", { class: "fx-button--primary" })
          )
        ),
        h("div", { class: "fx-progress", dataAnchor: "turret_xp_xp_bar" },
          h("div", { class: "fx-progress__bar", style: "width: " + xpPct + "%" }),
          h("span", {}, core.xp + " / " + core.xpNext + " XP")
        ),
        h("div", { class: "fx-header-stats" },
          h("span", {}, "Core " + liveCoreLeft + " live / " + planCoreLeft + " plan"),
          h("span", {}, "Aug " + liveAugLeft + " live / " + planAugLeft + " plan"),
          h("span", {}, "Damage " + stats.damage.toFixed(1)),
          h("span", {}, "Range " + stats.range.toFixed(0))
        )
      )
    );
  }

  function renderModeBar(fixture) {
    return h("div", { class: "fx-modebar", dataAnchor: "turret_xp_mode_bar" },
      h("div", { class: "fx-segment", dataAnchor: "turret_xp_build_plan_toggle" },
        button("Live", "set-mode", { value: "live", class: state.mode === "live" ? "is-active" : "" }),
        button("Build Plan", "set-mode", { value: "build", class: state.mode === "build" ? "is-active" : "" })
      ),
      h("label", { class: "fx-checkbox", dataAnchor: "turret_xp_follow_build_toggle" },
        h("input", { type: "checkbox", dataAction: "toggle-follow", checked: state.followBuild ? "checked" : null }),
        h("span", {}),
        "Follow build"
      ),
      h("div", { class: "fx-target" },
        h("strong", {}, "Target"),
        h("span", {}, fixture.copiedTarget || "No copied target")
      ),
      fixture.conflict ? h("div", { class: "fx-warning", dataAnchor: "turret_xp_build_conflict" }, fixture.conflict) : ""
    );
  }

  function renderProgressionEditor(fixture, kind) {
    const profile = getProfile(kind);
    return h("div", { class: "fx-editor", dataAnchor: "turret_xp_progression_editor" },
      h("div", { class: "fx-budget-strip" },
        h("strong", {}, state.mode === "build" ? "Editing Build Plan" : "Editing Live Core"),
        h("span", {}, "Core points left " + Math.max(0, fixture.budgets.core - totalCoreSpent(profile))),
        h("span", {}, "Augment points left " + Math.max(0, fixture.budgets.augment - totalAugmentSpent(profile)))
      ),
      section("Core upgrades", "turret_xp_progression_core_upgrades", model.upgrades.map((upgrade) => renderUpgradeRow(upgrade, kind))),
      section("Role path", "turret_xp_progression_role_path", renderRolePath(fixture, kind)),
      section("Elements", "turret_xp_progression_elements", renderElements(kind)),
      section("Powerful augments", "turret_xp_progression_augments", model.augments.map((augment) => renderAugmentRow(augment, kind)))
    );
  }

  function renderUpgradeRow(upgrade, kind) {
    const liveValue = state.live.upgrades[upgrade.id] || 0;
    const value = getProfile(kind).upgrades[upgrade.id] || 0;
    return h("div", { class: "fx-rank-row" },
      smallIcon(upgrade.icon),
      h("div", { class: "fx-rank-row__label" },
        h("strong", {}, upgrade.label),
        h("span", {}, (state.mode === "build" ? "Live " + liveValue + " / Plan " + value : "Rank " + value))
      ),
      h("div", { class: "fx-rank-row__effect" }, upgrade.perRank + (upgrade.unit ? " " + upgrade.unit : "")),
      h("div", { class: "fx-stepper" },
        button("-", "rank", { id: upgrade.id, delta: -1, kind }),
        h("span", {}, String(value)),
        button("+", "rank", { id: upgrade.id, delta: 1, kind })
      )
    );
  }

  function renderRolePath(fixture, kind) {
    const profile = getProfile(kind);
    return h("div", { class: "fx-role-grid" },
      model.roleChoices.map((role) => {
        const selected = profile.role === role.id;
        const conflict = fixture.conflict && role.id === profile.role;
        return h("button", {
          class: "fx-role " + (selected ? "is-active " : "") + (conflict ? "has-conflict" : ""),
          dataAction: "set-role",
          dataKind: kind,
          dataValue: role.id
        },
        h("strong", {}, role.label),
        h("span", {}, role.summary),
        conflict ? h("em", { dataAnchor: "turret_xp_build_conflict" }, "Copied target conflict") : "");
      })
    );
  }

  function renderElements(kind) {
    const profile = getProfile(kind);
    return model.elementChoices.map((element) => {
      const active = profile.elements && profile.elements.includes(element.id);
      return h("div", { class: "fx-element-row " + (active ? "is-active" : "") },
        smallIcon(element.id === "fire" ? "fire" : "element"),
        h("div", { class: "fx-element-row__text" },
          h("strong", {}, element.label + (active ? " active" : "")),
          h("span", {}, "Rank " + element.rank + " - " + element.summary)
        ),
        h("div", { class: "fx-mini-progress" },
          h("div", { style: "width: " + element.progress + "%" })
        )
      );
    });
  }

  function renderAugmentRow(augment, kind) {
    const value = (getProfile(kind).augments || {})[augment.id] || 0;
    return h("div", { class: "fx-rank-row fx-rank-row--compact" },
      smallIcon(augment.icon),
      h("div", { class: "fx-rank-row__label" },
        h("strong", {}, augment.label),
        h("span", {}, augment.description)
      ),
      h("div", { class: "fx-rank-row__effect" }, "Rank " + value + " / " + augment.max),
      h("div", { class: "fx-stepper" },
        button("-", "augment", { id: augment.id, delta: -1, kind }),
        h("span", {}, String(value)),
        button("+", "augment", { id: augment.id, delta: 1, kind })
      )
    );
  }

  function renderStatInspector(liveStats, planStats) {
    const rows = [
      ["damage", "Damage", "turret_xp_stat_damage"],
      ["dps", "Estimated DPS", "turret_xp_stat_dps"],
      ["speed", "Shooting speed", "turret_xp_stat_speed"],
      ["range", "Range", "turret_xp_stat_range"],
      ["hp", "HP", "turret_xp_stat_hp"],
      ["shield", "Shield", "turret_xp_stat_shield"],
      ["resistance", "Resistance", "turret_xp_stat_resistance"],
      ["crit", "Crit", "turret_xp_stat_crit"],
      ["ammo", "Ammo", "turret_xp_stat_ammo"]
    ];
    return h("aside", { class: "fx-inspector", dataAnchor: "turret_xp_stat_inspector" },
      h("div", { class: "fx-inspector__title" },
        h("strong", {}, "Stat Inspector"),
        button("Open details", "toggle-drawer", { value: "details" })
      ),
      h("div", { class: "fx-stat-list" },
        rows.map(([key, label, anchor]) => {
          const liveText = statText(key, liveStats);
          const planText = statText(key, planStats);
          return h("div", { class: "fx-stat", dataAnchor: anchor + (state.mode === "build" ? " turret_xp_build_plan_delta" : "") },
            h("span", {}, label),
            state.mode === "build"
              ? h("strong", { class: deltaClass(key === "crit" ? "critChance" : key === "ammo" ? "productivity" : key, liveStats, planStats) },
                liveText + " -> " + planText)
              : h("strong", {}, liveText)
          );
        })
      )
    );
  }

  function renderDetailDrawer(liveStats, planStats) {
    return h("section", { class: "fx-drawer", dataAnchor: "turret_xp_detail_drawer" },
      h("div", { class: "fx-drawer__title" },
        h("strong", {}, "Detailed Stats"),
        button("Close", "toggle-drawer", { value: "details" })
      ),
      h("div", { class: "fx-detail-grid" },
        h("div", {}, h("h3", {}, "Defense"), h("p", {}, "HP " + statText("hp", liveStats)), h("p", {}, "Shield " + statText("shield", liveStats)), h("p", {}, "Resistance " + statText("resistance", liveStats))),
        h("div", {}, h("h3", {}, "Offense"), h("p", {}, "Damage " + statText("damage", liveStats)), h("p", {}, "DPS " + statText("dps", liveStats)), h("p", {}, "Range " + statText("range", liveStats))),
        h("div", {}, h("h3", {}, "Build delta"), h("p", {}, "Plan damage " + statText("damage", planStats)), h("p", {}, "Plan DPS " + statText("dps", planStats)), h("p", {}, "Plan range " + statText("range", planStats))),
        h("div", {}, h("h3", {}, "History"), h("p", {}, "Kills and XP sources live here in Lua."), h("p", {}, "This drawer is secondary by spec."))
      )
    );
  }

  function renderCoreDetailsDrawer(fixture) {
    return h("section", { class: "fx-drawer", dataAnchor: "turret_xp_core_details_drawer" },
      h("div", { class: "fx-drawer__title" },
        h("strong", {}, "Core Details"),
        button("Close", "toggle-drawer", { value: "core" })
      ),
      h("div", { class: "fx-form-grid" },
        h("label", {}, h("span", {}, "Name"), h("input", { type: "text", value: fixture.core.name })),
        h("label", { class: "fx-checkbox" }, h("input", { type: "checkbox", checked: "checked" }), h("span", {}), "Show name"),
        h("label", { class: "fx-checkbox" }, h("input", { type: "checkbox", checked: "checked" }), h("span", {}), "Show level"),
        h("label", { class: "fx-checkbox" }, h("input", { type: "checkbox" }), h("span", {}), "Show unspent"),
        h("div", { class: "fx-color-row" },
          h("span", {}, "Label color"),
          ["white", "gold", "green", "blue", "red"].map((color) => h("button", { class: "fx-swatch fx-swatch--" + color, title: color }))
        )
      )
    );
  }

  function clampRank(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) {
      return;
    }
    const action = target.dataset.action;
    const fixture = currentFixture();

    if (action === "set-fixture") {
      loadFixture(target.dataset.id);
    } else if (action === "set-source") {
      state.source = target.dataset.value;
    } else if (action === "set-filter") {
      state.filter = target.dataset.value;
    } else if (action === "set-sort") {
      if (state.sort === target.dataset.value) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sort = target.dataset.value;
        state.sortDir = "desc";
      }
    } else if (action === "set-mode") {
      state.mode = target.dataset.value;
    } else if (action === "toggle-follow") {
      state.followBuild = !state.followBuild;
    } else if (action === "rank") {
      const profile = getProfile(target.dataset.kind);
      const id = target.dataset.id;
      profile.upgrades[id] = clampRank((profile.upgrades[id] || 0) + Number(target.dataset.delta), 0, 999);
    } else if (action === "augment") {
      const profile = getProfile(target.dataset.kind);
      const id = target.dataset.id;
      profile.augments[id] = clampRank((profile.augments[id] || 0) + Number(target.dataset.delta), 0, 8);
    } else if (action === "set-role") {
      getProfile(target.dataset.kind).role = target.dataset.value;
    } else if (action === "toggle-drawer") {
      if (target.dataset.value === "details") {
        state.detailsOpen = !state.detailsOpen;
      } else {
        state.coreDetailsOpen = !state.coreDetailsOpen;
      }
    } else if (action === "install-core" || action === "noop") {
      event.preventDefault();
    }

    if (fixture.screen === "picker" && action !== "set-fixture" && action !== "noop") {
      state.detailsOpen = false;
      state.coreDetailsOpen = false;
    }
    render();
  });

  loadFixture(state.fixtureId);
  render();
}());
