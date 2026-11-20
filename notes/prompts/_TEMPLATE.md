Version 1 · Updated {{YYYY-MM-DD}} · Master copy: local folder

{{Master prompt for handing a phase to another surface (usually the build to Claude Code). When this phase is done or the prompt is replaced, put "> SUPERSEDED (date): <what replaced it>" on line 1 and move it to notes/prompts/old/.}}

I'm {{user}}. We're starting {{phase}} of {{Project name}} ({{one sentence}}). It's due {{date}}. These parts are done: {{list}}. They're in `context/` as past context. Your job is {{the job}}, so that it reaches {{target level}} on every criterion that marks it.

## Step 0: load everything before you write a single line
1. Read `CLAUDE.md` in full. It sets the rules for this whole chat.
2. Read `context/02-spec.md` in full. It's the single source of truth for this phase. {{or the relevant source}}
3. Load the skill(s) {{list}} and follow them for {{what}}.
4. Read {{drafts this phase must match, e.g. the IPO: the build has to do exactly what it says}}.
5. Look at {{images / sources}} in order.
6. Skim `context/00-context.md` for the decision history and the consistency map. These are past pieces for background. Don't redo them.
7. Look at what already exists in `{{deliverable folder}}`. List what exists and what's missing.

Then reply with:
- (a) a 5-line summary of what you're about to do, so I know you've understood it;
- (b) every open question (every [ASK] in the spec, plus anything missing) as ONE batch;
- (c) the plan below with a time estimate for each phase.

Don't start Phase 1 until I've answered (b).

## The target (keep this in front of you the whole time)
| Criterion | Weight | What the top level looks like for {{Project name}} |
| --- | --- | --- |
| {{criterion}} | {{marks/weight}} | {{concrete description}} |

{{Note on level words, e.g. "'Advanced' means complete and correct with no mistakes at my level, not clever syntax."}}

## Plan
Do one phase at a time. At the end of every phase:
1. Check it against the gate (and the spec/storyboard side by side if there is one).
2. Run the skill self-checks.
3. Commit with a plain message.
4. Tell me in 3 to 5 lines what's done and what I should look at. If something doesn't match the spec, say so.

**Phase 1: {{name}}.**
- {{what}}
- Gate: {{the check that proves it}}

**Phase N: Test like the person who judges it.** Write `notes/testing-table.md` (Test | Steps | Expected | Actual | Pass/Fail | Fix). Put only real results in Actual. Leave what I must do as `[FILL]` and tell me which.

**Last phase: Handover.** Write `notes/handovers/{{date}}-{{this surface}}-to-{{next surface}}.md` from the template: the state now, what changed from the spec (table), what the next surface must and must not do, what only I can still do.

## Rules for this chat
- **The level is non-negotiable.** Follow the skill and the spec. If something needs a technique outside them, ask me first and explain why.
- **Teach as you go, briefly** {{if the user must be able to explain the work}}.
- **Be honest and direct.** If I'm wrong, say "you're wrong" and why. If something will cost marks or money, say how much. Rate things out of 10. Say when you're guessing.
- **Don't change earlier decisions quietly.** If this phase can't match the spec or an earlier piece, stop and ask. Log every change.
- **Never put anything from the workspace inside `{{deliverable folder}}`.**
- **Time matters.** It's due {{date}}. If we're running out of time, tell me what to cut and what it costs. Don't cut silently.

Start with Step 0.
