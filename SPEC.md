# Swing Game — Specification

This document is the source of truth for game rules, bet mechanics, and the
build plan. It was written with the group's scorekeeper before any code
existed. When code and spec disagree, the spec wins — or gets amended first.

---

## 1. Core concepts

### Players (roster)

A persistent roster saved across game days. Each player has:

- First name
- Last name
- Nickname (what actually shows on scoreboards and settlement sheets)
- Skill class: **A**, **B**, or **C** (editable — a player's class can change
  over time; a game day snapshots the class they had that day)

New players can be added on the fly during game day setup when someone new
shows up.

### Game day

One outing. A game day records:

- Date and (optional) course name
- **9 or 18 holes** — chosen at setup; all bets and calculations respect the
  hole count
- Par for each hole (needed for birdie/eagle detection; defaults to par 4,
  editable per hole)
- Which roster players attended (up to 50)
- Which bets are toggled ON for the day, with their dollar amounts
- Everyone's gross score on every hole

**Scores are always gross. No handicaps, ever.**

One scorekeeper enters all scores after the round from the paper cards. The
site does not need live multi-device entry — other players only view results.

---

## 2. The Swing Game (main game)

### Setup

1. Players who want in opt into the Swing Game (a subset of attendees).
2. A physical draw happens on the course (balls thrown from a pot); the two
   closest balls become the **Swing Team** — typically one A player and one B
   player. The app does not perform the draw; the scorekeeper just marks the
   two drawn players.
3. Every other Swing Game entrant is NOT on a fixed team. Instead, the Swing
   Team plays a separate match against **every possible 2-man combination** of
   the remaining entrants.

With `n` entrants, the Swing Team faces `C(n-2, 2)` simultaneous matches.
Example: 20 entrants → 2 on the Swing Team → C(18,2) = **153 matches**.

### Per-hole scoring (within one match)

- Format is **best ball**: a team's score on a hole is the lower of its two
  players' gross scores.
- Each hole is worth the day's per-hole stake `$X` (free entry — commonly
  $0.50–$2, but any amount).
- Lower best ball **wins the hole** (+1 hole for that team, −1 for the other).
- Equal best balls: the hole is a **push**. No money, no carryover, and a push
  **breaks a losing streak** for downs purposes (default; see toggle below).

### Downs (automatic new bets)

The group may play **N-downs** (1-down, 2-downs, 3-downs, ...):

- Within a match, whenever a team loses **N consecutive holes**, a **new bet**
  spawns starting on the next hole, at the same `$X` per hole.
- All existing bets keep running to the final hole. Bets never end early.
- Triggers are evaluated **only from the raw hole results of the match** —
  spawned bets never generate their own triggers. Both teams can trigger
  spawns; a long back-and-forth match can create many concurrent bets.

**Streak counting — two modes (per-day toggle, default OFF):**

- **Standard (default):** the consecutive-loss counter **resets** after
  spawning a bet. At 2-downs, losing 4 straight holes spawns a bet after hole
  2 and another after hole 4 — two new bets.
- **Stacking downs (toggle ON):** sliding window — every additional
  consecutive loss past the trigger spawns another bet. At 2-downs, losing 3
  straight spawns bets after hole 2 AND hole 3.

A push breaks the streak in both modes (open item #1 tracks whether a
"push preserves streak" variant is ever needed).

### Settlement

- Each bet covers the holes from its start hole through the final hole
  (9 or 18). Bet value = **(holes won − holes lost) × $X**.
- A match's total = the sum of all its bets (original + all spawned).
- Money flows only between the Swing Team and each opposing combination —
  the non-Swing entrants never owe each other anything through this game.
- A hole the Swing Team wins outright wins money on every active bet in every
  match simultaneously; the engine recomputes everything from raw hole scores,
  so corrections to any score just re-run the math.
- Per player: each Swing Team member's result is their team's aggregate; each
  non-Swing entrant's result is the sum of their matches (they appear in
  `n-3` different combinations).

### Worked example (2-downs, $1/hole, one match)

Holes 1–6 from the Swing Team's perspective: L L W W L L

- Bet 1 (holes 1–18): running the whole round.
- Swing Team lost holes 1–2 → **Bet 2** spawns at hole 3.
- Opponents lost holes 3–4 → **Bet 3** spawns at hole 5.
- Swing Team lost holes 5–6 → **Bet 4** spawns at hole 7.

Four concurrent bets by hole 7, all worth $1/hole, all running to 18, each
tallied independently over the holes it covers.

---

## 3. Side bets (per-day toggles)

Each bet below is independently toggled on/off at game day setup with its own
dollar amount(s). Any subset of attendees can be in each bet.

### Skins — pot format

- Everyone in the skins game antes a flat amount into a pot.
- A **skin** = outright lowest gross score on a hole among skins entrants.
  Ties = no skin on that hole (dead, no carryover).
- Payout after the round: pot ÷ number of skins won = value per skin.
- If zero skins are won (rare), the pot is refunded.

### Closest to the pin (greenies)

- Enabled per par-3 hole. Winner is determined on the course and entered
  manually by the scorekeeper.
- Either pot format (everyone antes) or flat amount per winner — chosen at
  setup.

### Birdies / Eagles / Albatrosses

- Auto-detected from gross scores vs. hole par.
- Each tier has its own dollar amount (e.g., birdie $1, eagle $5,
  albatross $25).
- **Every other participant in this bet pays the maker** the tier amount, per
  occurrence.
- Usually played within a cart, so participation is opt-in per day — only
  tracked here when the whole group buys in.

### Nassau

- Three bets: front nine, back nine, overall — each with its own amount
  (18-hole days only; a 9-hole day has no front/back split).
- Match play on holes won (individual or 2-man best ball) between defined
  sides.
- Usually played within carts; expected to be low-usage in the app. Modeled
  as a preset of the custom bet builder (below) rather than bespoke code.

### Custom side bets (catch-all)

The first-tee specials: any player(s) vs. any player(s), describable as one
of a few formats:

- **Match play** (individual or best ball) over a hole range, $ per hole or
  flat
- **Stroke play** (total gross over a hole range), flat amount
- **Manual** — free-text description + who pays whom how much, for anything
  the formats can't express. Guarantees nothing is ever untrackable.

### Future menu (stubs, not in initial build)

Snake (last 3-putt pays), Sandies, Barkies, Wolf, Vegas, Dots/Junk. The
toggle system is designed so these slot in as new bet types later.

---

## 4. Settlement sheet

The end-of-day money page:

1. Per-bet results (each Swing match with its bet-by-bet breakdown and when
   each down spawned — the dispute-settling view).
2. Per-player net across ALL bets for the day.
3. **Netted payment list**: minimal set of "X pays Y $Z" lines so the group
   settles in as few transactions as possible.

---

## 5. Screens

1. **Roster** — saved players (first, last, nickname, class); add/edit anytime.
2. **Game Day setup** — date, course, 9/18, hole pars; check off attendees
   (quick-add for new faces); mark Swing Game entrants and the drawn Swing
   Team; toggle the day's bets and set amounts.
3. **Score entry** — grid: players down the side, holes across. Optimized for
   keying 50 paper scorecards fast (tab/arrow navigation, numeric keys,
   par-tap shortcut). Plus manual entries: CTP winners, custom bet results.
4. **Results** — Swing Game leaderboard, per-match drill-down, side bet
   results.
5. **Settlement** — the money page (section 4).
6. **History** — past game days, viewable read-only.

---

## 6. Architecture

- **Frontend:** React + Vite SPA. All bet math runs client-side in a pure
  TypeScript engine (`engine/` module) — deterministic functions from
  `(scores, config) → results`, fully unit-tested. No calculation happens in
  the database.
- **Hosting:** Netlify, auto-deploy from `main`. `netlify.toml` in repo.
- **Data:** Supabase (free tier) — tables for players, game days, scores, bet
  configs, manual results. The app works read-only for viewers.
- **Access:** single shared passcode (site-wide gate). No individual accounts.
- **9/18 support:** hole count is a property of the game day; the engine and
  all screens are hole-count agnostic.

### Data model sketch

- `players` — id, first_name, last_name, nickname, class (A/B/C), active
- `game_days` — id, date, course, holes (9|18), pars (array), settings JSON
  (per-bet toggles + amounts, downs N, stacking flag)
- `attendance` — game_day_id, player_id, class_that_day, in_swing_game,
  on_swing_team
- `scores` — game_day_id, player_id, hole, gross
- `bet_participation` — game_day_id, bet_type, player_id
- `manual_results` — game_day_id, bet_type, hole?, player_id(s), amount,
  note (CTP winners, custom/manual bets)

All Swing Game matches, downs, skins, and birdie detection are **derived**,
never stored — recomputed from scores + settings on load.

---

## 7. Build phases

1. **Engine first** (pure functions + tests): Swing Game match generation,
   hole results, downs spawning (both modes), settlement math. This is the
   heart; it gets built and tested before any UI.
2. **Score entry + Swing Game results** — roster, game day setup, the score
   grid, Swing results and settlement for the main game only. This alone is
   already useful on the course.
3. **Side bets** — skins, CTP, birdie tiers, custom bets; full settlement
   sheet with netted payments.
4. **Persistence + access** — Supabase wiring, passcode gate, history view.
   (Phases 1–3 can run on local storage during development.)
5. **Polish + future bets** — Nassau preset, stubs menu, mobile layout tuning.

---

## 8. Open items

1. Confirm a pushed (tied) hole always breaks a downs streak — or does the
   group ever play "push preserves the streak"? (Default: push breaks it.)
2. Skins on a 9-hole day: same ante, fewer holes — assumed yes.
3. Does the group ever want two Swing Teams drawn (very large turnouts)?
   Assumed no for now.
