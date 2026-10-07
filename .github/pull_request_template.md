<!--
The title is the commit that reaches main, and the only thing release-please
reads: a Conventional Commit, with `!` before the colon for a breaking change.
Delete any section below that does not apply.
-->

## What changes

<!-- What a consumer sees before this pull request, and what they see after. -->

Closes #

## Screenshots

<!--
A change to what a component renders: every story it touches, in the light and
the dark theme, before (from main) and after. A new component: after alone.
AGENTS.md, under "Pull request bodies", says how to capture them.
-->

## API report

<!--
A change to etc/*.api.md: what changed for a consumer, and every type that now
accepts less than it did.
-->

## Breaking change

<!--
A title with `!`: end this body with the commit override AGENTS.md describes
under "Pull request bodies". The squash drops every commit body, so the override
is the only way the migration reaches the changelog. Its footer names the old
API, the new one and the edit to make, and the same change gets a line in
UPGRADING.md.
-->
