/* global window */
(function () {
  "use strict";

  const upgrades = [
    {
      id: "damage",
      label: "Damage",
      group: "core",
      max: 999,
      unit: "/ shot",
      perRank: "+0.5",
      icon: "damage",
      affectedStats: ["damage", "dps"]
    },
    {
      id: "resistance",
      label: "Resistance",
      group: "core",
      max: 240,
      unit: "taken",
      perRank: "-0.25%",
      icon: "resistance",
      affectedStats: ["resistance", "hp"]
    },
    {
      id: "shield",
      label: "Shield",
      group: "core",
      max: 999,
      unit: "shield",
      perRank: "+10",
      icon: "shield",
      affectedStats: ["shield"]
    },
    {
      id: "productivity",
      label: "Ammo productivity",
      group: "core",
      max: 999,
      unit: "",
      perRank: "+1%",
      icon: "productivity",
      affectedStats: ["ammo"]
    },
    {
      id: "critChance",
      label: "Crit chance",
      group: "core",
      max: 999,
      unit: "",
      perRank: "+0.25%",
      icon: "crit",
      affectedStats: ["crit"]
    },
    {
      id: "critDamage",
      label: "Crit damage",
      group: "core",
      max: 999,
      unit: "",
      perRank: "+1%",
      icon: "circuit",
      affectedStats: ["crit", "dps"]
    }
  ];

  const augments = [
    {
      id: "veteranTraining",
      label: "Veteran Training",
      description: "More XP from eligible combat.",
      max: 8,
      icon: "training"
    },
    {
      id: "doubleShot",
      label: "Double Shot",
      description: "Chance to fire a second projectile.",
      max: 8,
      icon: "double"
    },
    {
      id: "repairPulse",
      label: "Repair Pulse",
      description: "Occasional self-repair after quiet time.",
      max: 8,
      icon: "repair"
    }
  ];

  const roleChoices = [
    {
      id: "none",
      label: "No specialization",
      summary: "Base gun turret behavior.",
      modifiers: {}
    },
    {
      id: "sniper",
      label: "Sniper",
      summary: "Long range, heavy shots, slow fire rate, lower durability.",
      modifiers: {
        damagePct: 180,
        rangePct: 90,
        critDamagePct: 80,
        speedPct: -75,
        hpPct: -15
      }
    },
    {
      id: "machineGun",
      label: "Machine gun",
      summary: "Fast fire rate and ammo productivity, weaker shots.",
      modifiers: {
        speedPct: 120,
        productivityPct: 25,
        damagePct: -20,
        rangePct: -10
      }
    },
    {
      id: "bulwark",
      label: "Bulwark",
      summary: "Durable defensive anchor with lower attack output.",
      modifiers: {
        hpPct: 120,
        resistancePct: 15,
        damagePct: -25,
        speedPct: -15
      }
    },
    {
      id: "brawler",
      label: "Brawler",
      summary: "Short-range aggressive turret with strong close defense.",
      modifiers: {
        damagePct: 40,
        speedPct: 30,
        rangePct: -35,
        hpPct: 35
      }
    }
  ];

  const elementChoices = [
    {
      id: "fire",
      label: "Fire",
      rank: 3,
      progress: 62,
      summary: "Burn damage progress from supplied materials."
    },
    {
      id: "shock",
      label: "Shock",
      rank: 1,
      progress: 25,
      summary: "Chain arc unlock path."
    },
    {
      id: "toxic",
      label: "Toxic",
      rank: 0,
      progress: 0,
      summary: "Damage-over-time path."
    }
  ];

  const inventoryCores = [
    {
      id: "inv-a",
      name: "Veteran Core",
      level: 100,
      role: "None",
      hp: 400,
      attack: "25/s",
      range: 18,
      source: "Inventory"
    },
    {
      id: "inv-b",
      name: "Long Watch",
      level: 48,
      role: "Sniper",
      hp: 340,
      attack: "6.2/s",
      range: 34,
      source: "Inventory"
    },
    {
      id: "inv-c",
      name: "North Wall",
      level: 38,
      role: "Bulwark",
      hp: 880,
      attack: "21/s",
      range: 18,
      source: "Inventory"
    },
    {
      id: "inv-d",
      name: "Fast Feeder",
      level: 31,
      role: "Machine gun",
      hp: 400,
      attack: "55/s",
      range: 16,
      source: "Inventory"
    }
  ];

  const platformCores = [
    {
      id: "plt-a",
      name: "Orbit Aegis",
      level: 72,
      role: "Bulwark",
      hp: 910,
      attack: "22/s",
      range: 18,
      source: "Platform"
    },
    {
      id: "plt-b",
      name: "Railgun Spotter",
      level: 64,
      role: "Sniper",
      hp: 350,
      attack: "6.0/s",
      range: 36,
      source: "Platform"
    },
    {
      id: "plt-c",
      name: "Meteor Screen",
      level: 40,
      role: "Machine gun",
      hp: 400,
      attack: "58/s",
      range: 16,
      source: "Platform"
    }
  ];

  const baseLive = {
    role: "none",
    upgrades: {
      damage: 0,
      resistance: 0,
      shield: 0,
      productivity: 0,
      critChance: 0,
      critDamage: 0
    },
    augments: {
      veteranTraining: 0,
      doubleShot: 0,
      repairPulse: 0
    },
    elements: ["fire"]
  };

  const turretXpExample = {
    version: 1,
    projectId: "turret-xp",
    projectName: "Turret XP",
    defaultFixtureId: "installed_level_100_unspent",
    description: "Default example project for the Factorio GUI web editor.",
    upgrades,
    augments,
    roleChoices,
    elementChoices,
    fixtures: [
      {
        id: "empty_no_cores",
        title: "Empty turret, no cores",
        screen: "picker",
        picker: {
          sources: {
            inventory: [],
            platform: []
          }
        },
        copiedTarget: "No copied target"
      },
      {
        id: "empty_inventory_cores",
        title: "Empty turret, inventory cores",
        screen: "picker",
        picker: {
          sources: {
            inventory: inventoryCores,
            platform: []
          }
        },
        copiedTarget: "No copied target"
      },
      {
        id: "empty_platform_cores",
        title: "Empty platform turret",
        screen: "picker",
        picker: {
          sources: {
            inventory: inventoryCores.slice(0, 1),
            platform: platformCores
          }
        },
        copiedTarget: "Copied build target available"
      },
      {
        id: "installed_level_100_unspent",
        title: "Installed level 100",
        screen: "workbench",
        mode: "live",
        core: {
          name: "Veteran Core",
          level: 100,
          xp: 0,
          xpNext: 6600,
          bound: false,
          status: "Unbound",
          source: "Inventory"
        },
        budgets: {
          core: 100,
          augment: 8
        },
        live: baseLive,
        plan: {
          role: "none",
          upgrades: {
            damage: 18,
            resistance: 20,
            shield: 12,
            productivity: 10,
            critChance: 8,
            critDamage: 12
          },
          augments: {
            veteranTraining: 4,
            doubleShot: 2,
            repairPulse: 2
          },
          elements: ["fire", "shock"]
        },
        copiedTarget: "No copied target"
      },
      {
        id: "build_plan_unspent",
        title: "Build Plan preview",
        screen: "workbench",
        mode: "build",
        core: {
          name: "Veteran Core",
          level: 100,
          xp: 0,
          xpNext: 6600,
          bound: false,
          status: "Unbound",
          source: "Inventory"
        },
        budgets: {
          core: 100,
          augment: 8
        },
        live: baseLive,
        plan: {
          role: "sniper",
          upgrades: {
            damage: 14,
            resistance: 0,
            shield: 8,
            productivity: 0,
            critChance: 8,
            critDamage: 12
          },
          augments: {
            veteranTraining: 4,
            doubleShot: 3,
            repairPulse: 1
          },
          elements: ["fire"]
        },
        copiedTarget: "Manual build target"
      },
      {
        id: "copied_target_conflict",
        title: "Copied target conflict",
        screen: "workbench",
        mode: "build",
        core: {
          name: "Long Watch",
          level: 45,
          xp: 1800,
          xpNext: 3100,
          bound: true,
          status: "Bound",
          source: "Copied turret"
        },
        budgets: {
          core: 28,
          augment: 4
        },
        live: {
          role: "sniper",
          upgrades: {
            damage: 8,
            resistance: 0,
            shield: 4,
            productivity: 0,
            critChance: 5,
            critDamage: 10
          },
          augments: {
            veteranTraining: 2,
            doubleShot: 1,
            repairPulse: 0
          },
          elements: ["fire"]
        },
        plan: {
          role: "machineGun",
          upgrades: {
            damage: 12,
            resistance: 0,
            shield: 6,
            productivity: 12,
            critChance: 5,
            critDamage: 10
          },
          augments: {
            veteranTraining: 3,
            doubleShot: 2,
            repairPulse: 0
          },
          elements: ["fire", "shock"]
        },
        copiedTarget: "Copied target wants Machine gun",
        conflict: "Current core is Sniper. Copied target asks for Machine gun."
      }
    ]
  };

  window.FACTORIO_GUI_WEB_EDITOR_MODEL = turretXpExample;
  window.TURRET_XP_GUI_FIXTURES = turretXpExample;
}());
