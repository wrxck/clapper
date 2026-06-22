# Scriptwriting — making the copy and story consistently good

The weakest part of any automated promo is bland, generic copy ("Ship faster.").
This is how to write a script that earns attention. Compose the `scenes` array in
`clapper.config.json` against this.

## The structure

A strong 30-45s promo follows a shape. Map each beat to a scene type:

1. **Hook (0-3s)** — name + a single sharp promise, or a provocative line. The
   first second decides whether anyone keeps watching. `title`.
2. **Tension / the why (3-8s)** — the problem the product removes, in the user's
   words. One line. `title` or `bullets`.
3. **The product (8-18s)** — show it working. Real screenshots in a device frame,
   one capability per beat, captioned. This is the heart. `device` x1-3.
4. **Proof (18-26s)** — a number, a result, a trust signal, the differentiators.
   `stat`, `features`, or `bullets`.
5. **Values (26-31s)** — what you stand for (privacy, on-device, no ads...), if it
   is a real differentiator. `bullets`. Optional.
6. **Price / offer (31-37s)** — the offer, plainly. `pricing`. Optional.
7. **CTA (37-43s)** — name, URL, where to get it. `cta`.

Drop beats the product does not need; never pad to hit a length.

## Copy rules

- **Short.** Headlines <= 5 words. Sub-lines <= 9. If it does not fit on one line
  on 9:16, it is too long.
- **Concrete beats abstract.** "Log a meal by photo in 3 seconds" > "Powerful
  tracking". Show specifics, numbers, real feature names from the repo.
- **One idea per scene.** If a beat says two things, split it.
- **Active, present tense.** "Plan your week" not "Weekly planning is supported".
- **No clichc/filler.** Ban: "revolutionary", "seamless", "game-changing",
  "unlock", "elevate", "powerful", "effortlessly", "the future of", "reimagined".
  Cut any word that would appear in a hundred other promos.
- **Lead with the single most compelling thing** the product does, not a feature
  tour in repo order.
- **Caption everything.** Most social video is watched muted; the on-screen text
  must carry the message without sound.
- **Currency glyphs, not words.** In `pricing`, write `£3.99` / `$9` / `€5`, not
  "3.99 pounds" / "9 dollars". Keep each pricing sub-line to a single offer (one
  price per line) within the <= 9-word rule — do not cram a monthly price, a
  lifetime price and a trial into one run-on sub.
- **A `stat` is a real number.** Only use the counter scene for a number that
  means something counted up from 0 (`2.4x`, `40%`, `12,000`). A qualitative
  point ("zero accounts / servers / ads") is `bullets` or `title`, never a
  `stat` with `value: 0`, and a stat `label` is a short phrase, not a sentence.
  See the stat smells in [scenes.md](scenes.md).

## The critic pass (required)

After drafting the `scenes`, review the script adversarially before rendering.
Run it as repeated rounds — re-critique after each rewrite — and treat the
critique as the gate, not a formality.

**A round that produces zero critiques is a failure signal, not a pass.** An
empty critique almost always means the review did not actually run (a lens
returned nothing, the stills were not looked at, the model synthesised silence)
rather than that the film is flawless. If a round comes back with no findings,
do not accept it as "no issues found": re-run the review (re-render the stills,
re-read every frame, re-apply the lenses below) and only stop once a round has
genuinely been performed and surfaced either concrete findings or a specific,
defensible "checked X, Y, Z — all pass" for each rubric item. Never let an empty
round advance the film to render.

Ask, honestly:

- Would the first 2 seconds stop a thumb? If not, rewrite the hook.
- Is any line generic enough to belong to a competitor? Replace it with something
  only *this* product could say.
- Is there a clear single takeaway by the end? What is the one thing a viewer
  remembers?
- Is anything padding? Cut it; shorter is stronger.
- Does it show the product actually working, or just talk about it?
- **One idea per scene applies across the whole film, not just within a scene.**
  Tag each beat with its theme (privacy, speed, price, feature breadth…) and count
  them. If one theme repeats across multiple beats — e.g. privacy stated in a
  `title`, a `stat` and a `bullets` — that is redundancy, not emphasis: keep the
  single strongest beat for that theme and cut or re-theme the rest. As a rule of
  thumb, no theme should own more than one beat (the product shot aside). Three of
  eight beats all saying "on-device, no ads, own iCloud" is the canonical failure.

Rewrite, then run the [quality review](quality-review.md) on the rendered stills.

## Sourcing the copy from the repo

Pull real material rather than inventing: the README's one-liner and feature
list, marketing-page headlines, the app's own in-product strings/i18n, the
pricing, and the actual screen names. The best promo copy is the product's own
best sentences, tightened.
