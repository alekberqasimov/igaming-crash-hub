# IGAMING CRASH HUB

A one-repository GitHub Pages monorepo for the existing game portfolio.

Recommended repository name:

`igaming-crash-hub`

Expected public Hub:

`https://alekberqasimov.github.io/igaming-crash-hub/`

## What happens after the first upload

The included GitHub Action performs a ONE-TIME migration from the current public standalone repositories:

- `alekberqasimov/igaming-camel-race`
- `alekberqasimov/IGAMING_GOAL_RUSH_ALAKBAR`
- `alekberqasimov/Igaming-Penalty-demo`

It copies their current player/admin files into this repository:

```text
games/
├── camel-rush/
├── goal-rush/
└── penalty/
```

Current expected versions:

- Camel Rush v1.9.1
- Goal Rush v6.4.02
- Casino Penalty v25.14

The migration creates `games/.migration-complete`; normal later commits therefore do not overwrite your monorepo games.

## Final URLs

Hub:
`https://alekberqasimov.github.io/igaming-crash-hub/`

Camel Rush:
`https://alekberqasimov.github.io/igaming-crash-hub/games/camel-rush/`

Goal Rush:
`https://alekberqasimov.github.io/igaming-crash-hub/games/goal-rush/`

Penalty:
`https://alekberqasimov.github.io/igaming-crash-hub/games/penalty/`

Admin:
- `/games/camel-rush/admin.html`
- `/games/goal-rush/admin.html`
- `/games/penalty/admin.html`

## Future game

Add:

`games/new-game/index.html`

Recommended:
`games/new-game/admin.html`
`games/new-game/hub.json`

The Hub discovers directories under `games/` through the public GitHub Contents API.

## Important source-of-truth rule

After you confirm the monorepo works, update games directly inside `igaming-crash-hub/games/...`.

Do not routinely force-sync from the old standalone repositories, because a force sync replaces the three game folders with the versions from those old repositories.

Keep the old repositories until the new monorepo URLs have all been tested.
