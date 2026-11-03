# The per-part alignment test

Mitch, AD, 2026-11-01. A test of the form, not a drop for the game. One outfit (a hat, a coat of plate, leather boots, a sword)
as eight atlases sharing the same 26 frames, delays and pivots at the feet. Stacked in order and compared with the whole figure
drawn directly: 0.72 percent of the figure's pixels differ on average, 0.85 at worst (`report.json`). `compare.jpg`: the stack
above, the whole figure below.

**The draw order this needs, for one frame:** body, coat, far_front, head, hat, arm, sword, hand.

What this changes from the order in your message (cape, body, boots, hips, torso, gloves, head, helm, near arm, weapon, off-hand):

- **The far arm needs a layer on each side of the coat.** It crosses in front when it reaches forward or up, and behind otherwise.
  The frame decides: whichever layer is not in use is an empty frame. A single arm layer put it under the armour and differed by 5.3 percent.
- **The hand goes after the weapon.** The fist closes over the grip, so gloves cannot go before the head: a glove is two layers, the
  far hand with the far arm and the near hand last.
- **A hat or helm changes the hair.** The hair is its own layer, full or flattened, chosen by what the head slot covers.

Not tested: the cape, the shield, a robe over the legs, or any weapon but the sword, in this form.
