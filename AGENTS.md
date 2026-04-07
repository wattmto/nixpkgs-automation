# OpenCode workflow rules for this repository

This repository primarily stores automation that maintains a fork of `wattmto/nixpkgs`.

## Default scope

- Unless an issue explicitly says otherwise, keep all OpenCode work inside this repository.
- Treat the existing `merge-upstream.yaml`, `rebase-packages.yaml`, and `update-packages.yaml` workflows as production infrastructure. Do not change them unless the issue is specifically about them.

## Hard boundaries

- Do not push to `wattmto/nixpkgs` or any other external repository.
- Do not use `vars.APP_ID` or `secrets.APP_PRIVATE_KEY` for OpenCode-driven issue planning, implementation, or review.
- Do not modify secrets, repository settings, labels, or branch protection.
- Do not create more than one PR for the same issue.

## Planning lane

- Planning requests are comment-only.
- Convert the issue into explicit requirements, assumptions, a task breakdown, and a recommended implementation scope.
- Do not create a branch, commit, or PR while planning.

## Implementation lane

- Implement from the issue body plus the latest planning comment when available.
- Keep the write set minimal and repo-local.
- Create exactly one draft PR.
- Use a branch name that starts with `opencode/issue-<number>-`.
- If a PR already exists for the issue, update that lane instead of creating another.

## Review lane

- Review PRs by leaving comments only.
- Do not approve, request changes, merge, or push follow-up commits during review.

## Validation expectations

- Validate the files you change.
- For workflow changes, prefer syntax validation plus a dry structural check: verify the workflow trigger, `if` guards, permission scopes, concurrency key, and referenced secrets or inputs still line up with the intended lane behavior.
- For the dry structural check, explicitly confirm the workflow trigger matches the lane, the `if` conditions admit only intended events, the permissions are no broader than needed, the concurrency key isolates the lane, and every referenced secret or input matches the lane contract.
- For shell changes, run `bash -n`.
- Report the concrete commands you ran.
