# The Warrior: three rounds with Colin, AD (Robin, 2026-10-31)

Robin: once the hero is done, show it to the Survival game's Art Director for feedback, make the improvements he suggests,
three times; then show Robin the hero with the comments at each step.

The hero is painted 2D parts on a rig (`tools/hero_paint.js`), 23 frames: stand 4, move 6, attack1 6, hit1 1, die1 6, at
Miles, GD's rates. Pictures per round in `work/hero/iterations/`: `iterN.png` (beside the Turnip Grump on the fight slice at
phone size, every action's key pose), `iterN_sheet.png` (every frame), `iterN.gif` (moving).

## Iteration 1 (2026-10-31)

The first painted hero, after Colin's first review of the whole kit chose 2D parts over the Blender doll: one hair mass with
spikes, both eyes clear of the edge with catchlights, two legs, a hand on the sword, the one ink line; the windup goes
behind the head; the fall is onto the back.

### Colin's comments

Colin, AD, 2026-10-31 (on the still and the slice it stands on):

- Eyes: the thick ring round each eye and the raised brows look startled (Robin called a ringed round eye "surprised" on
  the boar). Lose the ring, let the iris fill more of the eye; save the startled face for the hit.
- Sword: it breaks the foot line, the tip below the feet, and hangs away from him. Shorten it or hold it so the tip stays
  above the ground.
- Stiff pose: two straight dark legs, a box torso and a stub arm stand like a peg. A wider stance, one foot forward, a
  slight lean, a real shoulder; MapleStory's people stand chunky but relaxed.
- Fringe: the zigzag is left over from the stand-in; fewer, larger, uneven locks.
- Shadow: one still has it, the other not; pick one.
- Hard tones: the hair has a soft horizontal band and the tunic a smooth ramp; paint both in hard tones.
- Flip him: hero and turnip face the same way, so he has his back to the fight.
- For the rig: the face as swappable sheets (normal, blink, hit, dead); hair spikes and the tunic's hem on their own
  pieces so they follow late; the sword pivoting from the hand with the arm its own piece; feet planted across frames;
  judge the clips at real delays.
- On the slice he stands in: a hard line through the background at y 330 and a straight field edge; the soil busy and
  one-sized; the lip too loud at the fighters' feet; crowns as combed strokes on a lollipop trunk; far trees stamped with
  crisp trunks on an empty band; donut clouds; the turnip soft where the tree is hard and its body a muddy grey; show the
  full phone screen with the panel on.

## Iteration 2 (2026-10-31)

Round one applied: the eyes without a ring and with an iris that fills most of the eye, relaxed brows close over them; a
short blade held forward so its tip clears the ground; a wider relaxed stance with the near foot forward, a slight lean
and a rounded shoulder cap; three large uneven locks for the fringe; hard tone bands on the hair and tunic; no shadow in
the sprite (the scene lays it); the fringe and the hem on their own lag so they follow late; the sword pivots from the
hand on its own arm piece; the hero flipped to face the fight in the pictures. The slice is now the full phone screen
with the panel on: the background line gone, the far trees hazed trunks and all with a mid plane of bushes, the soil
quiet with big calm areas and clods fading down, roots and blades hanging over the join, the lip calmer, clouds as flat
puffs shaded low.

### Colin's comments

Colin, AD, 2026-10-31 (on the poses, the sheet and the full screen; stills only):

- The attack swings backwards: the blade starts up by the face in front and ends down behind him; the foot kicks that way
  too. Wind up behind and over the head, strike forward and low with the blade out at arm's length, the front foot
  planted; add one smear or flash frame.
- The sword is in the wrong place at rest: it crosses the groin and legs, so blade, hand, legs and boots are one tangle at
  phone size. Hold it out on the enemy's side, tip up, so it makes its own shape. Fix this first; every clip starts from it.
- hit1 is not the strongest pose: shut eyes and a small o read as a yawn, the silhouette is the stand tilted. Eyes wide or
  squeezed, the mouth big, the head thrown back, arms and legs flung out, hair and hem flying, feet off the ground. And
  150 ms barely registers; the library's hit is 600.
- Everything rotates as a plank: hit, attack and the fall turn the doll as one piece. Lead with one part and let the rest
  arrive late: hips, then chest, then head, then hair. The death goes rigid and lands flat with the sword up like a
  candle: a stumble, knees going, a bounce and a squash on landing, the sword dropping away; the fade's last frames look
  unchanged.
- Stand and move are too quiet: the four stand frames nearly identical; in move the legs scissor under a body that barely
  bobs and the sword arm hardly joins in; move 0 has the feet together and the far hand a ball on the hip.
- The body is still a peg: a box torso, stub arms, near-black legs that merge with the boots and the soil. Lighter brown
  trousers, a bigger near arm with a chunky hand, a flare at the hem.
- Hair: the fringe is a paper-crown zigzag of hard triangles (vary the size, let one lock cross another); the tone band is a
  straight stripe, curve it round the skull.
- Keep: the eyes without the ring, the head's size, the hard skin shadow, the angry face on the attack, the face sheets.
- On the screen: the far trees are tombstones (grey stubs with a gap under the crown); the near crown's leaf fans became
  spidery stars; too many thin root scratches; the grass in front of the feet hides the boots; the clouds' curled underside
  reads as waves; the hills' dark blotches are stains; the turnip's bulk overpowers the hero (try 25 percent smaller: a
  starter monster sits well under the player); 400 px of empty sky between clouds and hills.
- Round three, in this order: the rest pose with the sword out and the attack swinging forward; a real hit pose and overlap
  in hit and die; the far trees fixed and the turnip smaller. Compare the frames at 2x with the Orange Mushroom's hit and
  the Slime's squash for the silhouette change (study only).

## Iteration 3 (2026-10-31)

Round two applied: the rig's swing sign fixed (forward is forward), so the attack winds up behind and over the head and
strikes forward and low with the blade out at arm's length, the front foot planted, with a smear on the two strike frames;
the rest pose holds the sword out in front, tip up, clear of the legs; hit1 is now the most exaggerated pose (head thrown
back, shocked eyes, a big mouth, arms and legs flung, feet off the ground, hair and hem flying) held 600 ms as the library
does; the parts arrive late (hips, then chest, then head, then hair) in hit, attack and the fall; the death stumbles, the
knees go, he lands on his back with a squash and a bounce and the sword drops away, then fades; stand breathes with the
chest and head and the hair follows; move bobs the body (the feet stay planted) and both arms swing; the trousers a brown
that separates from the boots; a bigger near arm and hand; a flare at the hem; the hair's tone bands curved round the
skull, the fringe three uneven locks with one crossing the others. On the screen: the far trees a wall of hazed crowns
with bushes at their feet (no stubs), the near crown's leaves as a few fat clumps, seven fat roots instead of many
scratches, shorter grass at the feet, flat low shade on the clouds, the hills bare, the ground raised to fill the sky
band, the Turnip Grump a quarter smaller.

Robin's pose-guide idea (2026-10-31), tried Colin, AD's way: the Survival project's Mixamo clips on this PC (Walking,
Standing Melee Attack Downward, React Large From Front, Death From Standing Idle) read in Blender as joint angles per frame
(`tools/build/guide_angles.py`) and drawn as grey stick guides at our proportions (`tools/guide_sheet.js`, in the ignored
`work/hero/guide/`). The walk confirmed my bones (thighs about 30 degrees each way, the hips lowest at contact and highest
at the passing step, the arms counter-swinging); the overhead strike corrected mine (the windup twice as long as the cut,
the body bent well forward at impact, the front leg lunging, the arm down past the hip). Both went into the clips,
exaggerated by about a third. The hit and the death stay drawn, as Colin said capture is too mild for them. Nothing from
the clips is shipped or in the repository.


Robin's own notes on iteration 2 (2026-10-31): "the colours and art are alright, but the proportions and placements are
weird, like he's a cripple: eyes different sizes, arms not connected properly, facing some half-side way, not really
holding the blade, it's stuck on his blob of a hand, the hair doesn't read as hair"; two sprites of his for what connects
right (a pixel knight in a clean three-quarter stance with the sword in a fist, and a side-view warrior with the arm
clearly jointed). Rebuilt on those lines for this round: one clean three-quarter view with the body's front showing and
both legs apart; both eyes the same size; every arm a shoulder cap, an upper arm, an elbow, a forearm and a fist; the
hilt runs through the fist with the guard above and the pommel below; the hair a cap with pointed tufts back and up and
three locks over the brow, lit as one mass with partings; the rest pose holds the blade up and forward as his first
example does.

### Colin's comments

Colin, AD, 2026-10-31 (the picture, the sheet and the screen; stills):

- Now right, leave alone: a clean three-quarter stance with both legs apart; the fist round the hilt with guard and pommel
  in place (that answers Robin's "stuck on his blob of a hand"); the rest pose with the blade out in front; the attack
  swinging the right way, forward and low; hit1 finally the strongest pose; the brown trousers apart from the boots; the
  clouds and bare hills.
- First: the far arm cannot be found; the striped fist at the hip reads as a bandaged knee or a patch on the trousers, and
  Robin already said the arms were not connected. Show the far upper arm and forearm clearly, bent at the hip, or put the
  far hand on the hilt.
- Second: the hair is too big and too even: a crown of similar triangles reads as a flame or a paper crown, the biggest and
  hottest shape on screen; it pushes head and hair past half his height, crowds the eyes down and close, and makes him
  about 120 CSS px instead of 100. Cut the mass by about a fifth; three or four big uneven tufts with a clear sweep in one
  direction, some curved.
- Third: the smear is a pure white strip with hard ends, like a paper ribbon, and runs below the ground line. Taper it
  from the blade's tip back along the path, thin at the tail, a pale tint, partly see-through, trailing the blade, stopping
  at the ground.
- Then: in the windup the blade barely shows (hidden behind the head), so raise the arm until the blade stands clear
  above the hair for a frame, and hold the strike a beat (400 ms for the whole attack is short); in the death the hand and
  hair spikes hang below the ground line and the last three frames look identical (the fade is data, check it); the rest
  arm is nearly straight and horizontal "as if handing the sword to someone", bend the elbow and bring the fist to chest
  height; the eyes look a bit cross-eyed and frantic under the hair, move them apart and turn the far gaze with the near
  one; the turnip still has ringed staring eyes, so the two faces do not match.
- The screen: the far trees still one ghosted clump with dark blotches and floating bottoms, one lone trunk at x 640;
  the near crown's arcs still comb-like (leave until Robin answers on the hero); the seven roots evenly spaced read as
  cracks, three uneven would do.
- How to show Robin: the rest pose big, the hit and the strike in clean frames; what was fixed from his own list, one
  line each; ask him two things, the hair's shape and how much of the head it takes, since those decide the character's
  look. "Three rounds done from my side. You've moved a long way in one day."

## Final (2026-10-31, after Colin's third round)

- The far arm shows whole along the far side of the body: a shoulder cap, a sleeved upper arm, an elbow, a forearm and a
  fist at the hip (it had been hidden behind the torso, with only its fist showing as a "patch").
- The hair cut by about a fifth: four big uneven tufts sweeping back, two of them curved, three locks over the brow; the
  crown lit as one mass. He stands about 111 CSS px to the hair's top (Robin to say how much head the hair may take).
- The eyes moved a little apart and up, both looking the way he faces.
- The rest arm bent at the elbow with the fist at chest height, the blade up and forward, clear of the body.
- The windup pulls the sword back behind at shoulder height, then straight up so the blade stands clear above the hair;
  the strike frame is held two beats (134 ms); the smear is a pale, part-transparent trail that tapers from the blade's tip
  back along its path and stops at the ground.
- The death lands on the back with the arms laid beside him and nothing below the ground line (the lying frames are
  lifted to the line after drawing); the fade is in the frame data (a0, a1 from 220 down to 0 over the last three).
- The screen: the far trees sit in one soft band of foliage with no trunks, the roots are three and uneven.
- Not done: the Turnip Grump's ringed eyes (its eyes are flat spheres with the render's line; a softer eye wants a change
  in its builder), the near crown's arcs (left until Robin answers on the hero, as Colin said).

Pictures: `work/hero/iterations/final.png` (the work folder is not in git; the pictures were sent into the chat on 2026-10-31) (the fight screen, every key pose), `final_poses.png` (the rest, the windup,
the strike and the hit, big), `final_sheet.png`, `final.gif`, `final_screen.png`.

## After Robin's second look (2026-10-31, the same evening)

Robin on the final: "he still looks strange: his neck and mouth are under his shoulder, his arm with the sword is on the
front of his body, his other arm looks twisted, his feet face forward", with a chibi reference where the body reads right.
Reworked: the head lifted onto a neck so the chin sits above the shoulders and the shoulder caps are smaller and lower;
the sword arm hangs at the side with the forearm out and the blade up and forward, nothing across the chest; the far arm
hangs plainly along the far side with its fist at the hip; the boots have a toe pointing the way he faces and a flat
sole; the eyes white with a dark pupil and a catchlight, a small nose; the fringe's locks end above the eyes. Sent to
Robin the same evening.

## Colin, AD's own Warrior, for comparison (2026-10-31, evening)

Robin asked Colin to make a hero from his own skills to my direction (C:\dev\SG\Art Director\out\zite_hero): Blender
volumes (parts swept along paths and voxel-merged into one skin, bound to bones with IK on the legs, four hard tones, the
face projected), the same colours, frame counts and rates, 99.8 CSS px tall; packed with the studio's packer it is a
1024-square atlas, 146 KB as a palette PNG (mine 120 KB in 1024 by 2048). My verdict to Robin: take Colin's construction
for the body (it cannot come apart, it is rounder and its hair is a cap of soft locks that reads as hair, the face is
alive) and his lesson that the sword belongs in the far hand at a three-quarter view; keep from mine the upright stance
with feet apart, the long clear blade, the bigger strike and hit shapes, the strike's trail and the hard flat tones that
match the turnip; reject his crouched knobby legs and his short foreshortened blade. Robin decides.

## Another try, as volumes: three variants (2026-10-31, late evening)

Robin: "do another try from what you learned, then present three variants"; and "Colin's legs look like a diaper". Built
on Colin's construction (`tools/build/warrior_vol.py`, from his `zite_hero.py`: balls swept along paths and voxel-merged
into one skin, bound to bones, IK legs, four hard tones, the face projected) with what both of us learnt: straight longer
legs under the hips and the tunic ending at the belt (no flared hem below it, no lowered hips: that was the diaper); the
sword in the far hand, held forward at the belt as Robin's side-view example holds it, so it stands clear of the chest and
the near arm hangs plainly; our upright stance with the feet apart; the overhead cut winding up high in front (behind, a
big head hides it, as Colin found) and landing low with the front foot lunging, the strike held two beats, a tapered trail
(`tools/smear.js` from the blade's tip the builder writes); our thrown-back hit; the death freeing the sword. Three looks:
A soft (Colin's rounded hair cap with fringe locks, a plain blue tunic), B spiky (pointed locks swept back and up, a
headband, a smaller head and longer legs), C cap (a steel cap with a leather rim and a red plume, short hair at the nape,
leather shoulder pads). Each 23 frames, a 1024-square atlas (C 1024 by 2048), about 650 KB before the palette shrink. The
pictures were sent into the chat; `tools/variants_board.js` draws the board. Robin picks.

## The painted look on Colin's skeleton (2026-10-31, night)

Robin on the three volume variants: "use your original art style but with his better skeleton; I don't like the 3D
computer graphics look for this game". So the hero is a puppet: `tools/build/warrior_vol.py --skeleton` writes where every
joint of Colin's rig lands in each frame (the hips, neck, head, both shoulders, elbows, wrists and fists, both hips, knees,
ankles, toes and heels, the sword's grip, guard and tip, with a depth each), and `tools/hero_puppet.js` paints my flat-toned,
ink-lined parts between those joints: the tunic from hips to neck, the head and hair on the neck, each arm as a sleeved
upper arm, a forearm and a fist, each leg as a trouser leg and a boot with a toe, the sword from grip to tip; parts drawn
farthest first by depth, so the near arm covers the body and the far one shows behind. The rig's poses are the volume
variants' (the sword in the far hand, upright with feet apart, the overhead cut landing low, the thrown-back hit, the
death freeing the sword). 23 frames, a 1024-square atlas, 441 KB before the palette shrink. Sent into the chat.

## Decided (Robin, 2026-10-31, night)

"Let's go with that for now. We can get back to it later." The painted puppet on Colin's rig is the Warrior. Delivered as
`out/warrior/` (a 1024-square palette atlas of 100 KB with its json, the frames, the pictures, the build scripts, NOTES.md
with the animation names, rates, pivots and stride) and sent to Miles, GD to copy. Left for later: the hair's locks, the far
leg in the walk, the turnip's eyes, the three other classes on the same rig.

## A try in the cartoon-vector hand (2026-10-31, late night)

Robin: "Honestly I think we need to rethink the whole art direction. Try creating a hero in this art style", with a stock
picture of a night village: stone towers, round trees, no ink line, every shape cut by tone against tone, cool blue-violet
shadows, crisp lighter highlight patches, saturated colour. `tools/vector.js` holds that hand (a tone set from one base
colour; a shaded shape with a shade crescent away from the light and lighter patches toward it; scalloped foliage; stone
blocks) and `tools/hero_vector.js` paints the Warrior with it on the same rig as the puppet; `tools/vector_stage.js` sketches a
meadow stage in it by day and night. Sent to Robin beside the ink Warrior. If he chooses this hand, the recipe, the kit,
the monsters and the ink Warrior all change to it; the rigs and the poses stay.

## For Robin to decide (later)

1. The hair's shape (these tufts swept back, or another cut) and how much of the head it may take: it sets the
   character's look and his height on screen.
2. Whether the Warrior's clothes and colours are his (blue tunic, brown trousers and boots, orange hair) or should change
   before the other three classes are built on the same rig.

## The fresh attempt (2026-11-01): the Warrior built the reference's way

Robin, 2026-11-01: the CC0 packs are no good; "do a new fresh attempt where you create the maplestory referenced one from
start." And: "Don't you also have the maplestory character animation to take inspiration from? Like the playable
character? It's probably in the files."

**The playable character is in the client, not in the library.** The reference library (`Settings/Inspiration`) holds
monsters and maps only; the player's parts are in the client's `Character.wz`. A study export into my scratch folder
(never the repo; `Export-Character.ps1`, written the way the library's own `Export-Inspiration.ps1` reads the client) pulled
one body, head, face, three hairs, shirts, trousers, shoes, two swords and a helmet with their data, and `assemble.js` put
whole frames together the way the game does: the body's origin at the feet, the arm on the navel, the head on the neck, the
face and the hair on the brow, the sword in the hand, drawn in the zmap's order. `measure_ref.js` read the joints per frame.

**What the reference's player is, measured** (reference pixels; our files are 200/65 = 3.08 times that):

- A paper doll of few parts: the body (torso and legs in one picture, 21 by 31 standing), one arm (10 by 19) hung on the
  navel, the head (39 by 35) on the neck, the face (26 by 16) and the hair (35 by 20) on the brow, shoes, the sword (41 by
  13) in the hand. The far arm is not drawn at all when standing or walking.
- The head is half the height and wider than the body. The neck sits 32 px above the feet, the navel 21, the head's centre
  47. The shirt ends at the navel; below it the shorts, the legs, big shoes, all bright.
- The face sits low and forward: both eyes in the front half of the head, right beside each other, their tops at the
  head's middle; tall almond eyes with a heavy, slanted upper lid (the front corner lower); a near-black iris filling the
  eye, grey-blue below, a big white highlight at the top front; thick dark brows right above the lids; a short mouth; no
  nose; pale skin with orange shading on the cheeks and under the fringe.
- Timing: stand 3 frames at 500 ms (a slow breath), walk 4 at 180, a swing 300, 150, 350 (windup, cut, the strike held), a
  stab 350, 450; the hit is a flash, the death a ghost.
- The strike lunges the whole body 20 to 33 px forward (a third to half the height) with the back foot stretched; the sword
  is as long as the body is tall.

**What I built** (`tools/doll.js`): the same doll at our scale, in our own parts: a skull with the ear at the back, the face
to the layout above, our orange spiky hair as a cap with a swept fringe to the eyes, the blue tunic with its belt, one slim
arm with the sword, tan trousers and red boots (dark trousers on dark boots were one blob at phone size; the reference keeps
its legs bright). Poses are dictionaries in the reference's units (x forward negative, y up negative, the feet at 0,0):
stand 4 at 350 ms with a blink; move 6 at 120 (the stride 14 px each way, the swinging foot lifted); attack1 6 (windup 200
and 100, the cut 67 with a trail, the strike 150 held twice, recover 100) with a lunge of 21 px and the back foot stretched;
hit1 600 ms leaning back with the sword thrown up; die1 6 at 83 ms: stagger, knees, falls on his back, fades. Packed with
`tools/pack.js` (23 frames; the atlas is shrunk to a palette PNG at delivery). Shown on the meadow beside the Bramble Bun,
before/after the puppet, and on a moving page (https://claude.ai/artifact/2jcNKzX951moJpQFBaGBYQ).

Robin, 2026-11-01, on the first version: "his face looks all weird, compare to the maple face." Measured against the
reference's face: ours had the eyes 14 px too low, 20 px too far apart, round where the reference's are tall almonds with a
slanted heavy lid, a bright glossy blue iris where the reference's is near-black, brows floating 10 px above the eyes, pink
blush where the reference shades orange, and the skin too dark. All redrawn to the reference's layout (the lines above),
checked head to head beside it at the same size. Then Robin: "your eyes need to be smaller and same size" (Robin,
2026-11-01): both eyes 25 by 28 px at 2x, equal. Robin judges; nothing delivered to `out/` until he does.
