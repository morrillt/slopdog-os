🧭 Questions for the Maester
Primary Types vs. Tags: In docsredo.md, you mentioned User How-To, Research, and Dev Notes. Should these become primary facets.type values (replacing note), or should they remain as tags?
yes these are the new primary facet subtypes for docs, there are also facets for planning derived delibables (tickets bugs tasks)




My recommendation: Make them primary types. It makes the menu logic and filtering much cleaner.
Summary Requirements: For the summary.human and summary.vector fields, should these be required for all new documents, or just optional for "published" ones?
- yes these will be required, but generated at publish.

Menu Transition: You suggested a docs2.0 section and a docs1.0 section. Do you want the AI to handle this by updating the mode.docs.mdc menu directly, or should we create a new mode.docs2.mdc? this is more logistical, honestly, I just think we need to totally overhaul the entire mode, so maybe we just start fresh.=


Ticket Location: Should I create this as a standalone ticket in plans/, or should I start a proper DOCS-2.0 Epic folder to keep things tidy?
We can make it brozos2.0 epic folder

📝 Draft Ticket (Preview)
Title: Docs 2.0: Reconcile Templates and Implement New Doc Types
User Story: As a semi-technical PO, I want a simplified documentation system with dedicated templates and AI-optimized summaries, so that my knowledge base is organized and vector-search ready.
Draft Acceptance Criteria:
AC-1: Consolidate docfrontmatterrules.md and front-matter-schema.md into a single Source of Truth: templates/docs-metadata-spec.md.
AC-2: Update taxonomy.yaml with the new types and the summary facet structure.
AC-3: Create three new base templates in templates/docs/: how-to.md, research.md, and dev-note.md.
AC-4: Update the broz:docs menu to include "Docs 2.0" handlers for these new types.
AC-5: (TDD) Implement a validation step that checks if the summary.vector is within the 300-400 word range.
How does this look to you? Answer these, and I'll carve the ticket into stone (markdown) stone.

- i dnt like ac-5, lets add some more AC's around publishing handler and workflow. so we can see them as an integrated whole.