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

## The critic pass (required)

After drafting the `scenes`, review the script adversarially before rendering.
Ask, honestly:

- Would the first 2 seconds stop a thumb? If not, rewrite the hook.
- Is any line generic enough to belong to a competitor? Replace it with something
  only *this* product could say.
- Is there a clear single takeaway by the end? What is the one thing a viewer
  remembers?
- Is anything padding? Cut it; shorter is stronger.
- Does it show the product actually working, or just talk about it?

Rewrite, then run the [quality review](quality-review.md) on the rendered stills.

## Sourcing the copy from the repo

Pull real material rather than inventing: the README's one-liner and feature
list, marketing-page headlines, the app's own in-product strings/i18n, the
pricing, and the actual screen names. The best promo copy is the product's own
best sentences, tightened.
