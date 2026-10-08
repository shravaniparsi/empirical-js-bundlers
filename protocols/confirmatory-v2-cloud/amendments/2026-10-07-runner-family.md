# Premeasurement amendment: hosted runner family

Date: 2026-10-07  
Protocol: `confirmatory-v2-cloud-m1`  
Primary observations collected before amendment: **0**

## Reason

The draft initially required the exact `macos-14` `ImageVersion` observed during capacity controls. GitHub documents that hosted-runner software images are updated weekly, so an exact image-version requirement cannot remain satisfied throughout a 420-block sequential campaign. GitHub also announced that macOS 14 hosted runners will be unsupported after 2026-11-02, with scheduled brownouts during October 2026.

Sources:

- <https://docs.github.com/en/actions/concepts/runners/github-hosted-runners>
- <https://github.com/actions/runner-images/issues/13518>

## Changes made before measurement

- Moved the target label and `ImageOS` from `macos-14`/`macos14` to `macos-15`/`macos15`.
- Kept architecture, exact Node, pinned dependency locks, pinned browser supplied through the locked Puppeteer closure, workloads, tools, schedule, sample counts, and within-VM complete blocking fixed.
- Made weekly `ImageVersion` and macOS patch/build recorded block metadata instead of exclusion criteria.
- Prespecified counts and paired estimates by image version plus leave-one-image-version-out sensitivity estimates.
- Prohibited using image version to select, trim, or remove a block.

## Inferential effect

Every tool in a randomized complete block still runs serially on the same fresh VM and image, so primary contrasts remain within-VM paired differences. The estimand now covers the standard GitHub-hosted `macos-15` Apple Silicon runner family during the collection window, rather than one short-lived patch image. Data from macOS 14 controls remain ineligible for primary analysis.
