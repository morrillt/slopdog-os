we want to make a new workflow called shard epic, that breaks an epic into a set of tickets that are ready for the broz os to run.

First read the design patterns for broz os workflows ~/code/citadel/docs/how-to/create-broz-os-components.md

Then consider an existiing epic,
Epic : ~/code/playground/scraper-yt/plans/epic-1-youtube-channel-monitor-chapter-summaries-mvp.md



THen make the workflow, (dont run it yet), that will allow us to  create a series of steps to generate a series of tickets.


Key rules
1. one user story per ticket
2. success criteria are testable
3. put a link to the epic.md in each ticket for full context.
3. tasks map to success criteria.....
4. at least one e2e and unit test per ticket. make reasonable. Almost always. Running these tests is part of the task itself.
5. tickets need to follow template.

this should essentially extend the build ticket workflow (which super important integrated ticket template ). Read through the build ticket workflow it may be a little thing and we can add a bit more sophistication to bring it inline with current os design patterns. We want the entire set of tickets to run then we want to after get a report and asnwer questions on the set of tickets.
Create ticket workflow: ~/.slopdog/rules/broz/workflows/plan/add_ticket.mdc
Ticket template: ~/.slopdog/templates/ticket.md


If any ambiguities come up while writing the tickets, write them down for a review ambiguity etc report at end separate step. ALso VERY IMPORTANTLY this is where the tech stack is  defined, so in the final report step should be ambiguities and tech stack options  suggestions / current decision....

pls ask me any questions before you get started here

ALso look at the create ticket / validate ticket workflows first, and THE TEMPLATES thats huge!
@~/.slopdog/templates/ticket.md @~/.slopdog/rules/broz/workflows/plan/add_ticket.mdc 



Quick questions before I write shard_tickets.mdc
Target project path: should this shard workflow assume the epic lives under ~/code/playground/scraper-yt/plans/ (like your example), or should it ask for any project path each run?
pull project path from  yaml context file


Where should ticket files be written? Pick one default:
A) ~/code/playground/scraper-yt/plans/tickets/
B) ~/code/playground/scraper-yt/plans/epics/<epic-slug>/ (we’d create this structure)

I like epic slug


Ticket ID scheme (since there are no existing TICKET-* files yet): what do you want?


Example options: TICKET-US-001, TICKET-EPIC-1-001, or TICKET-20260113-001
I like long names ticket title name epic not necessary because is in directory.

Sharding rule: confirm it’s 1 ticket per row in the epic’s user-story table (US-001, US-002, …), and we copy Edge Cases into the ticket (Dev Notes vs Acceptance Criteria)?

YES -c onfimed.

