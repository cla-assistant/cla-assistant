<!--
SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors

SPDX-License-Identifier: Apache-2.0
-->

# Common Issues and their solutions

Please check this document first, before opening an issue for common issues and their solutions.
It is split in relevant sections for "[Contributors](#contributor)" (contributing to a project and being required to sign a CLA) and "[Project Admins](#project-admin)" (requiring a CLA for their project and configuring that).

If you encounter a different issue or need further support, please open an issue. Also if you notice any outdated information here, please open an issue or directly a pull request to the them updated.

## Contributor

### You are not able to sign a CLA?
Please check that all commits in the pull request are associated with a GitHub account. A common problem is that the commit is associated with your internal company or dummy email. GitHub shows it as a gray icon like below.

![Greyed out GitHub commit icon](https://user-images.githubusercontent.com/43786652/80366188-1d32ff80-8889-11ea-9795-a5bfa5442692.png)

Please check the GitHub help article about "[Commits are not linked to any user](https://docs.github.com/en/github/committing-changes-to-your-project/troubleshooting-commits/why-are-my-commits-linked-to-the-wrong-user#commits-are-not-linked-to-any-user)" to resolve this and ensure that you rewrite/force-push all commits in your pull request.

### CLA assistant status or comment not updated?
Sometimes it happens that while you signed the CLA the status doesn't get updated. Might be a technical issue or some other problem. Most temporary issues can be solved by manually triggering a new check with navigating to
```
https://cla-assistant.io/check/<orgname>/<reponame>?pullRequest=<pr_number>
```
replacing `<orgname>`, `<reponame>` and `<pr_number>` with your respective values.

A full url would then look like this https://cla-assistant.io/check/cla-assistant/cla-assistant?pullRequest=603.

## Project Admin

### Unable to link organization?
CLA-assistant can as well manage a CLA for a complete organization.
For this the CLA-assistant GitHub OAuth App needs additional permissions:

1. Click on Configure CLA
2. Then select want to link an org as below
    ![](https://user-images.githubusercontent.com/33329946/61389742-b7f1bd00-a8b9-11e9-86aa-ad8d79a5138e.png)

After you provide this extra auth scope, you will be able to link the whole organization.

### CLA assistant status or comment not updated?
Sometimes it happens that while you signed the CLA the status doesn't get updated. Might be a technical issue or some other problem. Most temporary issues can be solved by manually triggering a new check with navigating to
```
https://cla-assistant.io/check/<orgname>/<reponame>?pullRequest=<pr_number>
```
replacing `<orgname>`, `<reponame>` and `<pr_number>` with your respective values.

A full url would then look like this https://cla-assistant.io/check/cla-assistant/cla-assistant?pullRequest=603.
