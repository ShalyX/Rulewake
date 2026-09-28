---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Rulewake turns a collateral-ratio rule change into a deterministic, auditable risk decision, then uses Qwen only to explain the verified result."
destination: hackathon-submission
aspect: 1920x1080
language: en
audience: "Bitget AI Base Camp judges, technical reviewers, and active traders managing collateral-rule risk"
length: 52s
angle: proof-led-product-demo
narration: minimal
captions: yes
source_url: https://rulewake.vercel.app/
---

## Intent

Create a cinematic 52-second launch film that proves Rulewake works. The film should move from the hidden danger of a collateral-ratio rule change to the real calculation, the changed risk state, and the validated Qwen explanation. It should feel like a live risk instrument under pressure, not a generic SaaS tour or a sequence of slides.

## Assets

- `../../outputs/uta-risk-desk/submission/screenshots/rulewake-live-desktop-initial.png` — verified production interface before calculation.
- `../../outputs/uta-risk-desk/submission/screenshots/rulewake-live-desktop-calculated.png` — verified deterministic result after calculation.
- `../../outputs/uta-risk-desk/submission/screenshots/rulewake-live-desktop-qwen-validated.png` — verified production frame showing `QWEN · VALIDATED` and `NUMERIC ALLOWLIST PASSED`.
- `../../outputs/uta-risk-desk/submission/screenshots/rulewake-live-mobile-initial.png` — verified 390×844 mobile state.
- `../../outputs/uta-risk-desk/submission/screenshots/rulewake-live-mobile-calculated.png` — verified 390×844 mobile result.
- `../../outputs/uta-risk-desk/submission/ARCHITECTURE.md` — verified architecture source if the final beat needs a compact system view.
- `https://rulewake.vercel.app/` — canonical production product and capture source.

## Customizations

- Primary job: prove the product; secondary job: launch it.
- Make the deterministic state change the central visual event: collateral ratio 90% → 85%, collateral value −$5,000, LTV 94.44% → 100.00%, warning → critical, $28,333.34 target buffer.
- Make `QWEN · VALIDATED` and `NUMERIC ALLOWLIST PASSED` the strongest late-film proof moment.
- Carry the Rulewake Causal Field identity into motion: causal lines, state propagation, pressure, and wake-like displacement.
- Keep the film fully legible when muted; narration should support the proof rather than carry it.

## Notes

- Use only verified production behavior and supplied evidence. Do not invent product capabilities, performance claims, trading outcomes, or liquidity guarantees.
- Do not expose any API key, secret, environment value, or private account data.
- Avoid slideshow grammar, generic editorial layouts, decorative crypto clichés, locks, shields, circuits, and generic gradients.
- Real product UI should dominate. Stylization may frame, focus, or connect real evidence, but must not replace it.
- Keep the final call human: Rulewake calculates and explains; the trader decides.
