# Licensing and security

Two things to get right before shipping a Remotion project: whether the work needs a
paid licence, and that you are on a current, secure version with every Remotion
package in lockstep.

## Licensing: who must pay

Remotion is open source but ships a CUSTOM licence, not MIT/Apache. Source code is
on GitHub and freely viewable, but commercial use by larger organisations requires a
paid Company Licence.

Free Licence (no payment) covers:

- Individuals.
- Non-profit / not-for-profit organisations.
- For-profit organisations with up to 3 employees.
- Non-commercial evaluation of Remotion.

Company Licence (paid) is required when:

- You are a for-profit organisation with 4 or more people.

How team size is counted (this is the part people miss):

- Headcount is aggregated across all parties involved in the work. An agency and its
  client are counted together, so a 2-person agency building a video for a 50-person
  client needs a Company Licence.
- Part-time employees and independent contractors count toward the total.
- The threshold is about organisation size, not how many people touch Remotion. A
  10-person company needs a licence even if only one developer uses it.

Pricing (verify the live figure before quoting it): Remotion advertises a per-seat
subscription, around USD 25 per seat per month for the creator tier; automation /
high-volume tiers carry a minimum monthly spend. Always check the current numbers
rather than trusting a cached value.

Authoritative sources:

- License overview: https://www.remotion.dev/docs/license
- LICENSE.md in the repo: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- Pricing and buying: https://www.remotion.pro/license
- The `@remotion/licensing` package exists to help companies measure and report
  seat usage programmatically: https://www.remotion.dev/docs/licensing

Practical guidance: decide the licence question at the start of a project. If the
end user is a company of 4+ people (directly or via aggregation), tell them a
Company Licence is required before the output is used commercially. When in doubt,
point them at the pricing page; do not guess eligibility for them.

## Staying on a current, secure version

Remotion releases very frequently (often multiple patch versions per week), and a
hard rule applies: every `@remotion/*` package MUST be on the exact same version.
Mismatched versions cause subtle render failures.

Check what is current and how recent it is:

```
npm view remotion version          # latest published version
npm view remotion time --json      # publish dates; confirm the release is recent
npx remotion versions              # verify all your installed packages agree
```

Pin exact versions in package.json (no `^` or `~`) so installs are reproducible:

```jsonc
{
  "dependencies": {
    "remotion": "4.0.482",
    "@remotion/cli": "4.0.482",
    "@remotion/player": "4.0.482"
  }
}
```

Audit dependencies before and after changes:

```
npm audit                  # report known advisories in the tree
npm audit --production     # ignore dev-only findings
npm audit fix              # apply non-breaking fixes
```

Remotion pulls in a large transitive tree (Chrome tooling, bundlers); most audit
findings will be in those dependencies rather than Remotion itself. Treat
high/critical advisories seriously and patch them.

## Safe-upgrade routine

Upgrade deliberately, never piecemeal:

1. Note the current version (`npx remotion versions`) and commit a clean tree first.
2. Run `npx remotion upgrade` — it bumps every `@remotion/*` package together to a
   matching version. Do not hand-edit single packages.
3. Reinstall and run `npm audit`.
4. Open the Studio and render a known composition; compare the output to the
   previous render. Remotion output is deterministic, so an unexpected visual change
   signals a regression to investigate before committing.
5. Read the release notes for any breaking changes (major Remotion changes are rare
   within 4.x but do happen).
6. Commit the lockfile alongside package.json so CI and teammates get the identical
   version.

## Security hygiene checklist

- Pin exact versions and commit the lockfile; reproducible installs are the baseline.
- Keep all `@remotion/*` packages identical; verify with `npx remotion versions`.
- Run `npm audit` on a schedule and after every dependency change.
- When rendering remote content or fetching data at render time, treat URLs as
  untrusted input; only fetch from sources you control, since the render runs a real
  browser. This matters doubly on Lambda/Cloud Run where the renderer has network and
  cloud credentials.
- Do not commit cloud credentials (AWS for Lambda) into the repo; use environment or
  secret stores.
- Re-confirm the latest secure version with `npm view remotion version` before
  scaffolding a new project, rather than copying an old pin.
