# Swing Game

A private golf betting tracker for a regular golf group. One scorekeeper enters
everyone's hole-by-hole scores after the round, and the site calculates every
bet — headlined by the group's main game, the **Swing Game** — and produces a
final settlement sheet showing exactly who owes whom.

## What it does

- Tracks hole-by-hole gross scores for up to 50 players per game day
- Calculates the Swing Game: the drawn Swing Team vs. every 2-man combination
  of the other entrants, best ball, per-hole stakes, with "downs" auto-bets
- Tracks toggleable side bets per game day: skins (pot), closest to the pin,
  birdie/eagle/albatross payouts, Nassau, and custom side bets
- Produces per-match breakdowns for dispute-settling and a netted
  who-pays-whom settlement sheet

## Rules and design

The complete game rules, bet engine specification, data model, and build plan
live in [SPEC.md](./SPEC.md). That document is the source of truth — when the
code and the spec disagree, the spec wins (or gets amended first).

## Stack

- React + Vite single-page app
- Hosted on Netlify (auto-deploys from this repo's main branch once linked)
- Supabase (free tier) for storage, so game days persist and are viewable
  by the group
- Shared passcode access — no individual accounts

## Status

Spec phase. No application code yet — see the build phases at the end of
[SPEC.md](./SPEC.md).
