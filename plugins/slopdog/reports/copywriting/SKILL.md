---
name: copywriting
description: Write prose that argues — the house voice for anything where the words are the product, not the wrapper. A landing page, a manifesto, a pitch, a README that has to convert, an essay, a launch post, a hard email, a section of a deck that has to persuade rather than inform. Use when Todd says "copywriting", "/slopdog:copywriting", "make this good", "this needs to be really well written", "write it properly", "punch this up", "make it sing", "this one matters", "I want to publish this", or when a piece of writing is going in front of people outside the house. NOT for routine replies, status updates (broz-report), report bodies (file-report, broz-report's deslop shape), commit messages or code comments — this is deliberately expensive and it is for when it matters.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
disable-model-invocation: true
---

# copywriting — the house voice when the words are the product

Built 2026-09-07 from a close read of ~98,000 words of David Heinemeier
Hansson's speech across two long-form interviews (Lex Fridman #474 and #501),
analysed independently by two readers whose findings converged. DHH is the
model because he argues for a living, in public, against opposition, and gets
read — and because his prose has a mechanism you can actually copy. This is a
**style system**, not an impersonation. We are stealing the machinery, not the
byline, and never the man's identity or claims.

**Pull-only, by Todd's call (2026-09-08).** A condensed copy briefly lived in
every Slopdog desk's always-on context; he cut it as not worth the space. There is
one file, this one, and it loads when you invoke the skill. Do not make a short
version somewhere else — a generated copy is still a copy, and it drifts.

---

## 0. When to run this, and when not to

**Run it when the words are the product.** A landing page. A manifesto. A
launch post. A pitch. A README meant to convert a stranger. An essay. A hard
email. A deck section that has to persuade rather than inform.

**Do not run it** on: status updates (`/slopdog:broz-report`), report bodies
(`/slopdog:file-report`, `/slopdog:broz-report deslop`), teaching material
(`/slopdog:broz-teach` — explanation wants a different voice entirely),
terminal replies, commit messages, code comments, or anything internal. This
voice is loud on purpose. Loud everywhere is just noise, and Todd's standing
output style already governs the chat reply.

**The tell that you need it:** someone outside the house is going to read this,
and they have the option of not finishing it.

**The cost, measured 2026-09-08.** Run against a real README, this voice clearly
beat the original on the opening — the original never said what problem existed —
and clearly lost on the reference sections, where the flat original list gave a
skimmer the facts faster. **This voice buys attention and spends skimmability.**
So: use it where someone has to be persuaded to care. Never where someone
already cares and needs to look something up.

---

## 1. The one-sentence theory

**Put the verdict first, earn it underneath, land on a fragment.**

Everything below is an elaboration of that sentence. If you remember nothing
else, that ordering — claim, mechanism, evidence, harder restatement — is 80%
of the effect. The reason it works is that it gives the reader something to
disagree with immediately, and disagreement is attention.

---

## 2. Architecture

### 2.1 The opener carries the claim

No warm-up. No "there are a few things worth considering here." No restating
the question. The first sentence is under ten words and it is the position.

> ❌ There are a number of factors that make the current approach to
>    onboarding worth re-examining.
> ✅ Our onboarding is broken.

Roughly a third of the source's turns open on a bare declarative or a
one-word verdict. That is the ratio to aim for: not every paragraph, but far
more of them than instinct suggests.

**The reasoning arrives after the claim, never before it.** A paragraph that
builds to its point has already lost the reader who bailed at sentence two.

### 2.2 Build by descent, not expansion

Take one concrete object and keep drilling into it. Do not gather three
parallel examples — take one and strip it down step by step, announcing each
step with an escalator:

- "But it gets better."
- "But it gets even better."
- "So let's flip it around."

The source does this with a single line of code, stripping punctuation one
character at a time until it reads as English. The shape transfers: pick the
smallest concrete thing that contains the argument, and take it apart in
public.

### 2.3 Concession-then-reversal — the single most-used unit

State the opposing case **generously, in full sentences**. Then refuse it in a
short one. The asymmetry in length is what makes the refusal land.

> We understand why teams reach for a design system. It removes a thousand
> small decisions, it makes four designers look like one, and it means the
> button is never wrong. All of that is true.
>
> It also means nothing is ever surprising.

**Order matters and is not negotiable: the concession goes first.** "I fully
accept X. What I object to is Y" leaves Y as the last thing on the page.
"Y, although of course X" leaves X. Never write the second one.

### 2.4 Repetition with escalation

Repeat the *verb phrase*; escalate the *object*. Three to five beats. The
escalation runs toward the abstract or toward the absurd — pick one and commit.

> They are not bottlenecked on engineers. They are not bottlenecked on
> budget. They are bottlenecked on having anything worth building.

This is the main amplifier in the voice. It is also the easiest thing to
overuse — once or twice per piece, at the moments that carry weight.

### 2.5 The list of three, where the third is the real one

The first two items are borrowed glamour; the third is what you actually came
to say. The triad is a smuggling device and it works because the reader's ear
accepts the pattern before it inspects the content.

> I want the tool that installs in a minute, the one that never asks me to log
> in, and the one I can delete without asking anyone's permission.

### 2.6 Land on a fragment

After a long build, the last sentence is two words, or one. It is harsher in
register than everything above it.

> Full stop. / Always. / Empirically not true. / That's grotesque.

**Never end on a summary.** No "in short", no "to recap", no restatement of the
three points. The sharpest sentence is the last sentence.

### 2.7 Rhetorical questions, two modes

**The catechism** — ask and answer your own, in a ladder that builds agreement,
then spend it:

> Is the security review necessary? Yes. Is it fair that it takes a week? Yes.
> Is any of that a reason it should take six? No.

**The incredulous counter-question** — aimed at an objector, never answered.
The question *is* the argument.

> Have you actually looked at what ships today?

### 2.8 Self-interruption to raise the stakes

Start the claim, stop, restate it bigger. Show the revision rather than hiding
it — it reads as thinking in public and it buys the stronger version credibility.

> It's good. Not good — it's the best thing we've shipped in three years.

---

## 3. The argument moves

### 3.1 Name the enemy

Never argue against an abstraction. Coin or adopt a **noun phrase** for the
thing you oppose, then argue against the name. The label does the work; the
rebuttal that follows can be two sentences.

The source's own coinages — *the merchants of complexity*, *line noise*, *the
toll booth*, *crud monkeys* — are his, not ours. **Coin your own.** A borrowed
coinage is a quotation; an invented one is a position.

Naming also makes an abstraction feel falsifiable, which is a rhetorical trick,
so make sure the named thing is real.

### 3.2 The number is the citation

Every general claim gets one lived, dated, quantified episode attached. Not an
illustration of the argument — *the argument*.

> ❌ Setup used to take a long time.
> ✅ Setup took forty-two minutes on a Mac. It takes one on ours.

The mechanic is worth understanding so you don't misuse it: the anecdote is
personal, so it cannot be disputed; the number makes it feel like data. That is
powerful and it is exactly why **the number must be true**. Never round toward
the argument. Never invent a figure to fill the slot — if you don't have one,
cut the claim to something you can count.

### 3.3 Extreme first, qualify second

State the maximal version. Soften in the *next* sentence, never the previous
one. By the time the qualifier arrives, the extreme sentence is the one that
gets quoted.

Flag the qualifier openly when the misreading is predictable: "I know what that
sounds like. I'm not saying that."

### 3.4 "This is not X, it is Y"

Win by seizing the definition rather than disputing the fact. Relabel the thing
under dispute before anyone can argue on the old label's terms.

> It isn't a pricing page. It's the first real conversation we have with them.

Used constantly in the source and it is the highest-leverage single move in the
whole system.

### 3.5 Reframe the technical as the aesthetic or the moral

Move the argument from *does it work* to *what kind of person wants this*. Slow
software is not inefficient, it's an insult. A locked-down device is not a
trade-off, it's a question of who owns the thing.

And say outright that taste needs no business case. Refusing to justify an
aesthetic judgment is itself the argument — the moment you build a business
case for beauty you have conceded that it needed one.

### 3.6 Contrarian inversion

Find the accepted flaw of the thing you're defending and argue it is the
advantage. Find the accepted strength of the thing you're attacking and argue
it is the trap. This is the voice's favourite pleasure and it is the reason it
gets read: it promises the reader a thought they haven't had.

### 3.7 Hold two truths

Refuse to resolve a contradiction into mush. "It is repugnant, and it is
wonderful." Naming the contradiction as deliberate — *both of these are true and
I'm not going to pick* — is more credible than either half alone, and it is
what stops the voice reading as tribal.

### 3.8 Analogy from outside the domain

Never explain software with more software. Reach for cars, watches, kitchens,
workshops, horses, instruments, buildings. The analogy carries the emotional
verdict; the technical detail follows it.

Pick from a **fixed personal stock** and reuse it — a consistent metaphor world
is a large part of what makes a voice recognisable.

### 3.9 Steelman, announce it, then refuse

Build the opposing case in full before knocking it down, and say you are doing
it: "If I'm going to steelman this for a second…" The announcement is what
makes the dismissal read as earned. Rare by design — announcing it every time
turns it into a tic.

### 3.10 Authority by named person, never by institution

"Fowler's point about…" not "research suggests". "Tobi saw it before I did" not
"industry consensus". Name the person, state their idea in one line, apply it.
Never *studies show*, never *best practice*, never *the literature*.

---

## 4. Diction

### 4.1 Register is high-low, with nothing in between

The base layer is short, physical, Anglo-Saxon: *build, ship, cut, strip, rip,
shave, chisel, smack, mop, pile, yank*. On top of that, exactly two extremes —
profanity and slang at one end, sudden lyrical or grand vocabulary at the other:
*glorious, sublime, marvel, transcendent, gorgeous*.

**There is no mid-register corporate layer at all.** That absence is most of the
effect. The moment a sentence could survive a marketing edit, it's dead.

### 4.2 Give abstract work a body

The most distinctive lexical habit in the source: cognitive work is described
with weight, texture and hands. Reviewing is looking at *the shape* and *the
proportions*. Simplification is *shaving grams*. Bad architecture is a *ball of
mud*. Bandwidth goes from *dial-up to fibre*.

When you catch yourself writing an abstract noun for a process, ask what it
would feel like in the hands.

### 4.3 Say the proper noun

Shopify, not "a large platform". McLaren, not "a performance brand". A brand
name is a compressed argument — it carries a whole value in one word and you do
not have to explain it. Assume the reader knows; do not gloss.

### 4.4 Intensifiers: absolute, not gradable

*Completely, absolutely, utterly, entirely, literally, 100%, full stop* — not
*very, quite, rather, fairly*. Numeric hyperbole substitutes for "very": "for
the four hundredth time", "a million reasons".

Note they are used to *celebrate a claim that is already strong*, never to prop
up a weak one. An intensifier on a hedge is the worst sentence you can write.

### 4.5 Profanity is rationed

Roughly once a page, and only in two places: on the noun being dismissed, or at
the peak of genuine enthusiasm. **Never at a person in the room.** Used
everywhere it stops working; used once, it is the loudest thing on the page.

House note: check the audience before it ships. A client-facing page gets none.

**Two words the source uses that we do not**: he twice uses a slur for
disability as an intensifier for obsolete technology. That is a register
violation we are not copying. It costs nothing to leave out and it would cost
Todd something real to leave in.

### 4.6 Where to go plain, where to go lyrical

**Plain** for mechanism, numbers, process, money and disagreement. Short,
unornamented, no adjectives.

**Lyrical** for endings, and for beauty, time, mortality, children, craft. The
lyric mode is the *last beat* of a passage and it has to be earned by the
plainness in front of it. One register jump per section, maximum.

### 4.7 The word list

**Reach for:** amazing, beautiful, glorious, delightful, joy, fun, frivolous,
malleable, opinionated, drudgery, taste, vision, ambition, blessing, irony,
craft, gorgeous, sublime.

**Never:** leverage, utilize, stakeholder, synergy, holistic, ecosystem,
impactful, learnings, best practice, delve, value-add, nuanced, robust,
seamless, at the end of the day, arguably, it could be argued, the literature
suggests, in some sense, to some extent, in my humble opinion.

The second list is not a style preference. Zero instances of any of it appear
in 98,000 words. That is the discipline.

---

## 5. The negative space — what is never there

This section is the most important one in the file. The voice is defined more
by what it omits than by what it does.

- **No throat-clearing.** No "great question", no "let me start by saying", no
  roadmap of what you're about to argue. First sentence carries content.
- **No hedging stack.** *Arguably, it seems, one might say, to some extent, in
  my humble opinion, I could be wrong but.* When genuinely uncertain, say so
  flatly and completely — "I don't know" — which is a statement, not a hedge.
- **No false balance as a landing.** Give the other side its best case, then
  rule. "There are good arguments on both sides" is never the last line.
- **No corporate register.** Nothing that survives a marketing edit.
- **No jargon without immediate cash-out.** A term of art gets defined in the
  same sentence, in one clause, or it doesn't appear.
- **No apologies**, and no pre-emptive softening for people who'll disagree.
- **No credentialing.** Cite your own experience constantly — as a specific
  dated episode with a number, never as "as someone with fifteen years in…".
- **No passive voice at the moment of judgment.** Someone is always doing the
  thing.
- **No abstraction where a proper noun exists.**
- **No enthusiasm without a named cost.** Every praise carries its trade-off.
  This is what stops the voice reading as marketing, and it is the single
  cheapest credibility purchase available.
- **No summaries. No recaps.** End on the sharpest sentence.

---

## 6. Disagreement, concession, being wrong

### 6.1 Pushing back

**At institutions:** hot, named, absolute. Indignation with a moral frame.
Escalate deliberately — and know you are doing it.

**At people:** attack the position, protect the person, and say so out loud.
The insult gets a *reason* attached in the same breath, which converts it from
abuse into argument: not "you're an idiot", but "you're an idiot, and here's
why". Front-load the credit before you land the principle.

**The most consistent move in the whole repertoire:** *you are wrong about that
and I still want you around.* Say both halves explicitly, in writing, every
time you attack a position.

### 6.2 The temporal insult

Characterise opponents as *stuck in time*, not stupid: "you haven't looked
recently", "that was true in March". It is un-rebuttable, it offers the
opponent a dignified exit, and it leaves the door open for them to agree with
you later without losing face.

### 6.3 Dismissing

Short, flat, final, and **shorter than your engagement with things you
respect.** Length is respect — withhold it deliberately. Do not argue with
something you have decided to dismiss; state the dismissal and move on.

### 6.4 Conceding

One line, no ceremony, no elaboration. Concede *facts and process points*
freely; concede *conclusions* almost never.

### 6.5 Admitting you were wrong

Fully, early, dated, with the mechanism of the error — and then immediately
reframed as evidence for the current position: *I resisted this and it
converted me anyway.* Never walk a self-concession back. Being wrong gets a
sentence; being right gets a story. That asymmetry buys the right to be
absolute everywhere else.

### 6.6 Pre-empt the bad-faith reading

State the attack in your critics' voice before they can, then decline to be
wounded by it. "I know how that sounds. I'm not saying that."

### 6.7 The honest limit on all of this

The source hedges a great deal — but only in two zones: **predictions**, and
**other people's motives**. He is absolute about what he has seen and cagey
about what hasn't happened yet. Copy that split exactly. Confidence about the
future is the failure mode that makes this voice insufferable.

---

## 7. The procedure

**Step 1 — find the verdict.** Before writing anything, write the one sentence
that is the whole position, under ten words. If you can't, you don't have a
piece yet — you have a topic. Stop and go get the argument.

**Step 2 — find the enemy.** What orthodoxy is this against? Name it in a noun
phrase. If nothing is being argued against, this may not want this voice at all.

**Step 3 — collect the numbers.** Every claim you intend to make, find the one
lived episode with a figure attached. Verify each one. Cut any claim you can't
attach a real number to.

**Step 4 — draft in the shape.** Verdict → mechanism → number → harder
restatement. Concessions before claims. One escalating repetition per section
maximum. Land every section on a fragment.

**Step 5 — the deletion pass.** This is where most of the quality comes from.
Delete, in this order:
   1. Every first sentence that doesn't carry a claim.
   2. Every hedge that protects you rather than adds accuracy.
   3. Every abstraction that has a proper noun available.
   4. Every summary, recap and "in short".
   5. Every word from the never-list in §4.7.
   6. Every enthusiasm with no cost named beside it.

**Step 6 — the read-aloud.** Read it out. Anywhere your voice flattens, the
sentence is too long or too abstract. Anywhere you'd naturally pause and go
harder, that's where the fragment belongs.

**Step 7 — the register check.** Count the mid-register corporate words. The
target is zero. Count the profanity — one per page, audience-appropriate, or
none.

**Step 8 — the honesty check.** Every number verified. Every named person
represented fairly. Every extreme claim genuinely held, not manufactured for
punch. **The voice is only worth having if it's true** — its whole power comes
from sounding like someone who means it, which is a thing you can only fake
once.

---

## 8. Worked example

**Before** — competent, invisible, dead:

> We've recently made some improvements to our onboarding flow. Previously,
> users needed to complete a number of steps before reaching the main
> application, which we found could sometimes lead to drop-off. Leveraging
> feedback from our stakeholders, we've streamlined this significantly, and
> we believe the new experience should be much more seamless for the majority
> of users.

**After** — the shape applied:

> Our old signup asked you eleven questions before it showed you anything.
>
> We understood why. Every one of those questions was asked by someone with a
> good reason — the sales team needed the company size, support needed the
> time zone, and the growth team wanted the referral source. All of that was
> true, and every one of them was right.
>
> Nine hundred people a month closed the tab.
>
> The new signup asks for an email address. That's it. Everything else we now
> learn the way you'd learn it about a person you'd just met: slowly, and only
> when it comes up. It costs us the referral data. We'll take it.

Note what happened: verdict first, generous concession in full sentences, the
number as the pivot, a redefinition ("the way you'd learn it about a person"),
the cost named out loud, and a three-word fragment as the landing. No
adjectives doing the work that facts should do.

---

## 9. Calibration — how loud

The voice has a volume knob. Turn it down for a client, up for a manifesto.

| Piece | Verdict-first | Fragments | Profanity | Enemy named |
|---|---|---|---|---|
| Manifesto, launch post, essay | Every paragraph | Yes | Once, maybe | Explicitly |
| Landing page, README | Every section | Yes | No | Implied |
| Pitch, hard email | Opening only | Sparing | No | Named privately, not on the page |
| Client-facing anything | Opening only | No | No | No — argue the position, not the party |

What never changes at any volume: no throat-clearing, no hedge stack, no
corporate register, a real number behind every claim, and no summary at the end.

---

## 10. Don't

- **Don't impersonate DHH or anyone else.** No borrowed coinages presented as
  ours, no invented quotes, no writing in a real person's name. We took the
  machinery. The opinions have to be Todd's.
- **Don't manufacture an extreme position for the punch.** If the honest claim
  is moderate, write the moderate claim in this shape. A voice this confident
  attached to something you don't believe is the fastest way to burn it.
- **Don't invent the number.** Ever. §3.2 is the load-bearing move in the whole
  system and one fabricated figure destroys it retroactively.
- **Don't use this on internal work.** Status reports, teaching, terminal
  replies and commit messages have their own skills and their own shapes.
- **Don't stack the devices.** One escalating repetition, one triad, one
  register jump per section. Three in a row reads as a parody of itself.
- **Don't apply it to someone else's draft without saying what you changed.**
  This voice makes claims sharper; sharper claims need their author's consent.
- **Don't let it into Todd's chat replies.** The standing output style governs
  there and it is a different, quieter thing.

---

## Reply format

Say what the verdict sentence is, what the enemy is, and which numbers you
verified. Then the draft or the path to it. Nothing else — the piece is the
deliverable, not a description of it.

---

## Sources

Both transcripts are on disk at `~/Downloads/` (`lex-474-dhh-transcript.txt`,
`lex-501-dhh-transcript-official.txt`), with DHH's turns extracted to
`dhh-only-474.txt` and `dhh-only-501.txt`. Public transcripts at
lexfridman.com/dhh-david-heinemeier-hansson-transcript and
lexfridman.com/dhh-2-transcript. Two independent analyses, 2026-09-07,
converged on §2–§6; where they differed, the weaker pattern was cut.

**Known limits of the source.** It is spoken interview, not prose. Tag
questions ("right?"), "like", "I mean" and "sort of" are speech rhythm and do
not transfer — they are excluded above deliberately. The tight architecture is
strongest when the source is arguing about work and loosest when he is being
asked about his life; the patterns here are drawn from the former.
