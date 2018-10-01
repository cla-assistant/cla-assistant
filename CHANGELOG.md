# Change Log

## [v1.8.3](https://github.com/cla-assistant/cla-assistant/tree/v1.8.3) (2018-10-01)

**Merged pull requests:**
- Allow specifying a custom login page template. [\#375](https://github.com/cla-assistant/cla-assistant/pull/375) ([chrisgavin](https://github.com/chrisgavin))

**Fixed bugs:**
- avoid node deprecation warning: Unhandled promise rejection... Use asyn/await for server/services/cla.isClaRequired
- remove hardcoded paths to the badges and remove legacy code

## [v1.8.2](https://github.com/cla-assistant/cla-assistant/tree/v1.8.2) (2018-09-11)

**Fixed bugs:**
- don't change gist url on edit but keep the existing one or use html_url of the gist [\#366](https://github.com/cla-assistant/cla-assistant/issues/366)

## [v1.8.1](https://github.com/cla-assistant/cla-assistant/tree/v1.8.1) (2018-07-09)

**New features:**
- provide a URL to the CLA page of the linked repo (show a tooltip for the linked orgs with the info how to reach the CLA page) [\#156](https://github.com/cla-assistant/cla-assistant/issues/156)

## [v1.8.0](https://github.com/cla-assistant/cla-assistant/tree/v1.8.0) (2018-07-06)

**New features:**
- add edit screen for linked repos and orgs
- provide a possibility to whitelist committers [\#173](https://github.com/cla-assistant/cla-assistant/issues/173), [\#232](https://github.com/cla-assistant/cla-assistant/issues/232), [\#197](https://github.com/cla-assistant/cla-assistant/issues/197)
- add origin flag to the signatures in order to differentiate between signatures made via CLA Assistant tool, imported signatures and signatures comming via API 
- provide a possibility to import signature date and custom fields in addition to github user names [\#328](https://github.com/cla-assistant/cla-assistant/issues/328)
- project owners can provide a link to their privacy policy and obtain user consent before signing the CLA [\#329](https://github.com/cla-assistant/cla-assistant/issues/329)

**Fixed bugs:**
-  fix unexpected authentication loop on cla sign for repos with names containing .js [\#348](https://github.com/cla-assistant/cla-assistant/issues/348)

## [v1.7.1](https://github.com/cla-assistant/cla-assistant/tree/v1.7.1) (2018-06-25)

**New features:**
- add sourceclear scan to the build pipeline
- add acceptance/integration tests

**Fixed bugs:**
- fix signature process: update comment and status on sign [\#340](https://github.com/cla-assistant/cla-assistant/issues/340)
- use promise for permission check and getLinkedItem

## [v1.7.0](https://github.com/cla-assistant/cla-assistant/tree/v1.7.0) (2018-06-11)

**New features:**
- allow upload signature date and custom fields [\#328](https://github.com/cla-assistant/cla-assistant/issues/328), [\#195](https://github.com/cla-assistant/cla-assistant/issues/195)
- set origin flag on sign (UI / API / Upload)

**Fixed bugs:**
- don't call count api if the host is not cla-assistant.io [\#334](https://github.com/cla-assistant/cla-assistant/issues/334)
- check users admin rights for orgs [\#331](https://github.com/cla-assistant/cla-assistant/issues/331)

## [v1.6.0](https://github.com/cla-assistant/cla-assistant/tree/v1.6.0) (2018-05-25)

**New features:**
- show username and logout button on the cla page 
- update to angular 1.7.0

**Closed issues:**
- CLA signed but assistant still says not signed [\#241](https://github.com/cla-assistant/cla-assistant/issues/241)

**Fixed bugs:**
- update vulnerable dependencies

## [v1.5.0](https://github.com/cla-assistant/cla-assistant/tree/v1.5.0) (2018-04-10)

**Fixed bugs:**
- add null check on commits returned by graphAPI - Anton Kharitonov
- don't use pagination in api/cla, github servise loads all pages per default - Anton Kharitonov
- fix validation org repos - don't break the app if linked repo doesn't have a repoId - Anton Kharitonov

**New features:**
- Add no-sniff MIME type protection - Michael Tseng

## [v1.4.1](https://github.com/cla-assistant/cla-assistant/tree/v1.4.1) (2018-02-21)

**Fixed bugs:**

- don't use pagination in api/cla, github servise loads all pages per default
- add null check on commits returned by graphAPI

## [v1.4.0](https://github.com/cla-assistant/cla-assistant/tree/v1.4.0) (2018-01-10)
**Fixed bugs:**

- Checker stuck on "Waiting for status to be reported" [\#303](https://github.com/cla-assistant/cla-assistant/issues/303)
- Unable to import csv file containing github usernames of contributers who have already signed the CLA.  [\#188](https://github.com/cla-assistant/cla-assistant/issues/188)
- CLA status shows up as Pending incorrectly [\#150](https://github.com/cla-assistant/cla-assistant/issues/150)
- CLA-Assistant integration not working [\#122](https://github.com/cla-assistant/cla-assistant/issues/122)
- Status not updated after adopting commit email [\#113](https://github.com/cla-assistant/cla-assistant/issues/113)
- Recheck PRs doesn't check all pull requests [\#102](https://github.com/cla-assistant/cla-assistant/issues/102)
- rendering issues on firefox [\#94](https://github.com/cla-assistant/cla-assistant/issues/94)
- "Sign in" broken on cla-assistant.io  [\#60](https://github.com/cla-assistant/cla-assistant/issues/60)
- update dependencies [\#56](https://github.com/cla-assistant/cla-assistant/issues/56)
- View bug when site is loading [\#45](https://github.com/cla-assistant/cla-assistant/issues/45)
- Consider compressing images [\#42](https://github.com/cla-assistant/cla-assistant/issues/42)
- show all activated repos I can access [\#24](https://github.com/cla-assistant/cla-assistant/issues/24)
- Possible mismatch of comment on pull request with its status [\#13](https://github.com/cla-assistant/cla-assistant/issues/13)

**Closed issues:**

- WebHook isn't being created for an Organisation [\#302](https://github.com/cla-assistant/cla-assistant/issues/302)
- Add bot users to whitelist [\#301](https://github.com/cla-assistant/cla-assistant/issues/301)
- Added email to github but still says that it is not signed. [\#295](https://github.com/cla-assistant/cla-assistant/issues/295)
- CLA Assistant was unlinked and removed but still haunts old pull requests [\#294](https://github.com/cla-assistant/cla-assistant/issues/294)
- Append .md file extension to the file containing SAP Individual Contributor License Agreement [\#293](https://github.com/cla-assistant/cla-assistant/issues/293)
- CLA doesn't work for me \( doesn't see my GitHub user\) [\#292](https://github.com/cla-assistant/cla-assistant/issues/292)
- Could you help me understand why we need to drop all index of 'clas' collection and recreate again? [\#291](https://github.com/cla-assistant/cla-assistant/issues/291)
- What is "org\_cla" and why does it mean "Signed for Organization" [\#283](https://github.com/cla-assistant/cla-assistant/issues/283)
- Changing comment message [\#281](https://github.com/cla-assistant/cla-assistant/issues/281)
- Copyright notice on cla-assist.io [\#280](https://github.com/cla-assistant/cla-assistant/issues/280)
- when trying to sign a CLA, I get an error  [\#277](https://github.com/cla-assistant/cla-assistant/issues/277)
- cla-assistant.io responds with 404 Not Found [\#276](https://github.com/cla-assistant/cla-assistant/issues/276)
- Incorrect port environment variable in the documentation [\#273](https://github.com/cla-assistant/cla-assistant/issues/273)
- Export CSV only shows invalid characters [\#267](https://github.com/cla-assistant/cla-assistant/issues/267)
- Commit blamed to generic email [\#266](https://github.com/cla-assistant/cla-assistant/issues/266)
-  signed CLA but assistant still says not signed. [\#265](https://github.com/cla-assistant/cla-assistant/issues/265)
- How can I add another admin to the linked organization? [\#263](https://github.com/cla-assistant/cla-assistant/issues/263)
- I have signed a CLA but it's always in pending status [\#261](https://github.com/cla-assistant/cla-assistant/issues/261)
- Inconsistent signed status [\#260](https://github.com/cla-assistant/cla-assistant/issues/260)
- garbage prepended to all headings [\#259](https://github.com/cla-assistant/cla-assistant/issues/259)
- Alibaba Individual Contributor License Agreement [\#258](https://github.com/cla-assistant/cla-assistant/issues/258)
- CLA status reporting not working  [\#256](https://github.com/cla-assistant/cla-assistant/issues/256)
- Heading are rendered with link glyph permanently visible when using .md file [\#255](https://github.com/cla-assistant/cla-assistant/issues/255)
- Can't access one of my organisations and can't reauthorise [\#253](https://github.com/cla-assistant/cla-assistant/issues/253)
- Enable link repo with a different CLA from its org CLA if exists [\#251](https://github.com/cla-assistant/cla-assistant/issues/251)
- Can't sign CLA? [\#247](https://github.com/cla-assistant/cla-assistant/issues/247)
- Questions about the way of handling webhook event [\#244](https://github.com/cla-assistant/cla-assistant/issues/244)
- why so many permissions? [\#243](https://github.com/cla-assistant/cla-assistant/issues/243)
- Already Signed CLA for Uber/Hoodie. Still it complains. But the page is shown as signed. [\#242](https://github.com/cla-assistant/cla-assistant/issues/242)
- Allow any org admin to see / export the list of signers [\#240](https://github.com/cla-assistant/cla-assistant/issues/240)
- Differentiate between employees and external contributors  [\#239](https://github.com/cla-assistant/cla-assistant/issues/239)
- No obvious way to import repos in an org you didn't select the first time around [\#233](https://github.com/cla-assistant/cla-assistant/issues/233)
- Enable certain people NOT to sign a CLA [\#232](https://github.com/cla-assistant/cla-assistant/issues/232)
- Unable to sign up CLA [\#229](https://github.com/cla-assistant/cla-assistant/issues/229)
- "Status waiting to be reported" never completes [\#228](https://github.com/cla-assistant/cla-assistant/issues/228)
- Can we skip CLA when a PR only has some small minor changes, e.g. 1 line change.  [\#226](https://github.com/cla-assistant/cla-assistant/issues/226)
- How to implement the feature of showing custom field based on other custom fields [\#225](https://github.com/cla-assistant/cla-assistant/issues/225)
- The way of generating the redirect url is not working properly on windows server [\#224](https://github.com/cla-assistant/cla-assistant/issues/224)
- Changing the URL of the gist containing the CLA [\#223](https://github.com/cla-assistant/cla-assistant/issues/223)
- Action required: Greenkeeper could not be activated 🚨 [\#221](https://github.com/cla-assistant/cla-assistant/issues/221)
- URGENT! 404 Not Found: Requested route \('cla-assistant.io'\) does not exist. [\#220](https://github.com/cla-assistant/cla-assistant/issues/220)
- Getting double notifications on Github [\#218](https://github.com/cla-assistant/cla-assistant/issues/218)
- CLA appears as not signed [\#217](https://github.com/cla-assistant/cla-assistant/issues/217)
- Change license  [\#215](https://github.com/cla-assistant/cla-assistant/issues/215)
- cla email invalid [\#214](https://github.com/cla-assistant/cla-assistant/issues/214)
- CLA Stopped working, error: Unexpected token in JSON [\#213](https://github.com/cla-assistant/cla-assistant/issues/213)
- Am I an affiliate for using this? [\#212](https://github.com/cla-assistant/cla-assistant/issues/212)
- Suddenly all our cla-assistant related tasks are not completing [\#211](https://github.com/cla-assistant/cla-assistant/issues/211)
- I have signed but still in pending [\#207](https://github.com/cla-assistant/cla-assistant/issues/207)
- Delay updating GitHub after signing CLA [\#206](https://github.com/cla-assistant/cla-assistant/issues/206)
- I have signed CLA but the CLA check still said I haven't check [\#202](https://github.com/cla-assistant/cla-assistant/issues/202)
- Status check not working [\#200](https://github.com/cla-assistant/cla-assistant/issues/200)
- Added email to github but still says that it is not signed.  [\#198](https://github.com/cla-assistant/cla-assistant/issues/198)
- I have signed agreement many time still it shows it is not signed.  [\#194](https://github.com/cla-assistant/cla-assistant/issues/194)
- Issue after update github username [\#192](https://github.com/cla-assistant/cla-assistant/issues/192)
- cla assistant is not working [\#191](https://github.com/cla-assistant/cla-assistant/issues/191)
- EU regulations conformance [\#190](https://github.com/cla-assistant/cla-assistant/issues/190)
- I'm getting checks on an unadded repository [\#189](https://github.com/cla-assistant/cla-assistant/issues/189)
- How long deal with Contributor License Agreement? [\#187](https://github.com/cla-assistant/cla-assistant/issues/187)
- Problem with signing CLA after changing username/email [\#186](https://github.com/cla-assistant/cla-assistant/issues/186)
- CLAassistant thinks CLA isn't signed, yet it is [\#185](https://github.com/cla-assistant/cla-assistant/issues/185)
- Sign CLA for entire organization  [\#184](https://github.com/cla-assistant/cla-assistant/issues/184)
- Page says I've accepted, badge on Github says I haven't [\#181](https://github.com/cla-assistant/cla-assistant/issues/181)
- Phone number field should not be a input type=number [\#180](https://github.com/cla-assistant/cla-assistant/issues/180)
- Just can't get a check to pass [\#179](https://github.com/cla-assistant/cla-assistant/issues/179)
- Capture email address, address etc [\#178](https://github.com/cla-assistant/cla-assistant/issues/178)
- Can I revoke access for a specific organization? [\#177](https://github.com/cla-assistant/cla-assistant/issues/177)
- Organization repositories do not appear in the link list [\#176](https://github.com/cla-assistant/cla-assistant/issues/176)
- Provide an API or direct download link to CSV exports [\#175](https://github.com/cla-assistant/cla-assistant/issues/175)
- Seems to fail when trying to retrieve repositories/organizations [\#174](https://github.com/cla-assistant/cla-assistant/issues/174)
- How to approve the greenkeeper? [\#172](https://github.com/cla-assistant/cla-assistant/issues/172)
- CLA check gives false positive when committing with another user [\#170](https://github.com/cla-assistant/cla-assistant/issues/170)
- Recheck PRs on newly added org are all pending [\#169](https://github.com/cla-assistant/cla-assistant/issues/169)
- Not checking the full commit range [\#168](https://github.com/cla-assistant/cla-assistant/issues/168)
- Export API / Periodic Export? [\#166](https://github.com/cla-assistant/cla-assistant/issues/166)
- \[Question\] Proof of CLA [\#164](https://github.com/cla-assistant/cla-assistant/issues/164)
- Is it enough to have only the username in the CSV file when importing? [\#160](https://github.com/cla-assistant/cla-assistant/issues/160)
- Is it possible to ask for a recheck a specific PR  [\#159](https://github.com/cla-assistant/cla-assistant/issues/159)
- Linked organizations aren't visible to other users [\#158](https://github.com/cla-assistant/cla-assistant/issues/158)
- Option to exclude repositories if organization is linked [\#157](https://github.com/cla-assistant/cla-assistant/issues/157)
- Too much empty space on top [\#155](https://github.com/cla-assistant/cla-assistant/issues/155)
- CLAassistant is posting twice for new contributors [\#154](https://github.com/cla-assistant/cla-assistant/issues/154)
- Contributor Covenant Code of Conduct as the CLA [\#152](https://github.com/cla-assistant/cla-assistant/issues/152)
- content "window" is too small [\#149](https://github.com/cla-assistant/cla-assistant/issues/149)
- Feature: More custom field  [\#148](https://github.com/cla-assistant/cla-assistant/issues/148)
- Don't work [\#147](https://github.com/cla-assistant/cla-assistant/issues/147)
- Still showing pending even if I've signed CLA [\#146](https://github.com/cla-assistant/cla-assistant/issues/146)
- Linked repositories list is blank \(it used to contain ~6 entries\) [\#145](https://github.com/cla-assistant/cla-assistant/issues/145)
- Asking people to sign CLA again [\#144](https://github.com/cla-assistant/cla-assistant/issues/144)
- hidden custom fields [\#143](https://github.com/cla-assistant/cla-assistant/issues/143)
- Term of Use [\#141](https://github.com/cla-assistant/cla-assistant/issues/141)
- What is the suggested setup to run cla-assistant on our own instance? [\#140](https://github.com/cla-assistant/cla-assistant/issues/140)
- Save also the GitHub id, email and name if provided. [\#137](https://github.com/cla-assistant/cla-assistant/issues/137)
- Let contributor accept one of several CLAs [\#136](https://github.com/cla-assistant/cla-assistant/issues/136)
- @XAXICLOUDDEV [\#135](https://github.com/cla-assistant/cla-assistant/issues/135)
- Can't link after unlink-ing once [\#134](https://github.com/cla-assistant/cla-assistant/issues/134)
- Cannot sign CLA, but I've signed it before and it has worked [\#133](https://github.com/cla-assistant/cla-assistant/issues/133)
- @xaxiclouddev [\#132](https://github.com/cla-assistant/cla-assistant/issues/132)
- cla-assistant does not find one of my repositories [\#130](https://github.com/cla-assistant/cla-assistant/issues/130)
- CLA-Assistant not detecting full github name with dash in it [\#128](https://github.com/cla-assistant/cla-assistant/issues/128)
- licence/cla — Waiting for status to be reported \(https://github.com/PBSPro/pbspro/pull/68\) [\#124](https://github.com/cla-assistant/cla-assistant/issues/124)
- Sign the agreement \(multiple times\) but project says it still is not signed [\#123](https://github.com/cla-assistant/cla-assistant/issues/123)
- Explicitly E-mail signers and repository maintainers when a CLA is signed [\#121](https://github.com/cla-assistant/cla-assistant/issues/121)
- Do not present CLA form if consent is already granted [\#120](https://github.com/cla-assistant/cla-assistant/issues/120)
- Unable to link an organisation repo [\#119](https://github.com/cla-assistant/cla-assistant/issues/119)
- CLA assistant v2 [\#118](https://github.com/cla-assistant/cla-assistant/issues/118)
- as collaborator, signing the CLA does not get tracked [\#116](https://github.com/cla-assistant/cla-assistant/issues/116)
- "not signed yet." when I've clicked the link multiple times [\#114](https://github.com/cla-assistant/cla-assistant/issues/114)
- Loading indicator while loading your "Linked CLAs" [\#112](https://github.com/cla-assistant/cla-assistant/issues/112)
- Add a handler for a ping event in web hooks [\#109](https://github.com/cla-assistant/cla-assistant/issues/109)
- Add contributors to GitHub team [\#108](https://github.com/cla-assistant/cla-assistant/issues/108)
- Does the CLA need to be signed per PR if already accepted for a repo [\#107](https://github.com/cla-assistant/cla-assistant/issues/107)
- Webhook call returns unsupported event [\#106](https://github.com/cla-assistant/cla-assistant/issues/106)
- Customize CLAassistant comment wording [\#105](https://github.com/cla-assistant/cla-assistant/issues/105)
- Problems with the port on Cloud Foundry [\#104](https://github.com/cla-assistant/cla-assistant/issues/104)
- Status: webhook missing [\#103](https://github.com/cla-assistant/cla-assistant/issues/103)
- Share a single cla for all projects in an organization [\#101](https://github.com/cla-assistant/cla-assistant/issues/101)
- CLAHub [\#100](https://github.com/cla-assistant/cla-assistant/issues/100)
- Is there a way to give another user access to see who has signed the CLA create links etc. [\#99](https://github.com/cla-assistant/cla-assistant/issues/99)
- provide option to import a list of emails instead of GitHub users [\#98](https://github.com/cla-assistant/cla-assistant/issues/98)
- Too wide GH API permissions required just to sign a CLA [\#97](https://github.com/cla-assistant/cla-assistant/issues/97)
- Transferring repositories to a new organization [\#96](https://github.com/cla-assistant/cla-assistant/issues/96)
- Multiple committers under same GitHub account aren't linked [\#95](https://github.com/cla-assistant/cla-assistant/issues/95)
- Retroactively requiring users to sign CLA? [\#93](https://github.com/cla-assistant/cla-assistant/issues/93)
- $JTZ\ [\#92](https://github.com/cla-assistant/cla-assistant/issues/92)
- option to disable the comment on PRs when the author has signed already [\#91](https://github.com/cla-assistant/cla-assistant/issues/91)
- still being maintained? [\#89](https://github.com/cla-assistant/cla-assistant/issues/89)
- Allow badge type to be selected [\#88](https://github.com/cla-assistant/cla-assistant/issues/88)
- Not all organization repositories showing up [\#87](https://github.com/cla-assistant/cla-assistant/issues/87)
- PR check not green although all contributors signed [\#86](https://github.com/cla-assistant/cla-assistant/issues/86)
- Link Based CLA Signing [\#83](https://github.com/cla-assistant/cla-assistant/issues/83)
- Allow import of CLAHub CSV Files [\#82](https://github.com/cla-assistant/cla-assistant/issues/82)
- Signer not being notified [\#81](https://github.com/cla-assistant/cla-assistant/issues/81)
- Issues when there are more than 100 repositories / gists [\#80](https://github.com/cla-assistant/cla-assistant/issues/80)
- need to show all signers for any version, not just the last one [\#79](https://github.com/cla-assistant/cla-assistant/issues/79)
- cla-assistant wants too many authorizations [\#78](https://github.com/cla-assistant/cla-assistant/issues/78)
- CLA status reporting not working [\#77](https://github.com/cla-assistant/cla-assistant/issues/77)
- Badge for CLA assistant [\#76](https://github.com/cla-assistant/cla-assistant/issues/76)
- Add screenshots to marketing page [\#75](https://github.com/cla-assistant/cla-assistant/issues/75)
- CLA Commiter's List Not Updated After Rebase/Force Push [\#74](https://github.com/cla-assistant/cla-assistant/issues/74)
- CLA disappeared for cockroachdb/cockroach [\#71](https://github.com/cla-assistant/cla-assistant/issues/71)
- Use separate repo for CLA + list of signees [\#70](https://github.com/cla-assistant/cla-assistant/issues/70)
- After I've successfully signed the CLA still get "not signed yet" [\#68](https://github.com/cla-assistant/cla-assistant/issues/68)
- migrating to cla-assistant [\#67](https://github.com/cla-assistant/cla-assistant/issues/67)
- multiple repos, same CLA [\#66](https://github.com/cla-assistant/cla-assistant/issues/66)
- Write access to Gists? [\#65](https://github.com/cla-assistant/cla-assistant/issues/65)
- Store more information about the CLA signer [\#64](https://github.com/cla-assistant/cla-assistant/issues/64)
- hook running, but not doing anything [\#63](https://github.com/cla-assistant/cla-assistant/issues/63)
- Link multiple repos in one flow [\#62](https://github.com/cla-assistant/cla-assistant/issues/62)
- Don't ask repository owners to sign a CLA ? [\#61](https://github.com/cla-assistant/cla-assistant/issues/61)
- System is down [\#59](https://github.com/cla-assistant/cla-assistant/issues/59)
- spelling mistakes on github.io page [\#55](https://github.com/cla-assistant/cla-assistant/issues/55)
- another sign-out icon [\#53](https://github.com/cla-assistant/cla-assistant/issues/53)
- success modal view has no header any more [\#52](https://github.com/cla-assistant/cla-assistant/issues/52)
- still need app.min.js [\#51](https://github.com/cla-assistant/cla-assistant/issues/51)
- set pull request status to green if all committers have signed the CLA [\#49](https://github.com/cla-assistant/cla-assistant/issues/49)
- Error Page for non-existing repositories [\#48](https://github.com/cla-assistant/cla-assistant/issues/48)
- FAQ [\#47](https://github.com/cla-assistant/cla-assistant/issues/47)
- Export list of signees [\#46](https://github.com/cla-assistant/cla-assistant/issues/46)
- create default entry for CLA drop down list  [\#44](https://github.com/cla-assistant/cla-assistant/issues/44)
- Text for Slides [\#43](https://github.com/cla-assistant/cla-assistant/issues/43)
- Text: Info Box 'Don't have one?' [\#41](https://github.com/cla-assistant/cla-assistant/issues/41)
- Thin text a bit difficult to see on lower resolutions [\#40](https://github.com/cla-assistant/cla-assistant/issues/40)
- Landing page: signature animation [\#39](https://github.com/cla-assistant/cla-assistant/issues/39)
- pop up fade in [\#38](https://github.com/cla-assistant/cla-assistant/issues/38)
- wording [\#37](https://github.com/cla-assistant/cla-assistant/issues/37)
- Terms of Service & Privacy Policy [\#36](https://github.com/cla-assistant/cla-assistant/issues/36)
- List of my signed CLAs [\#35](https://github.com/cla-assistant/cla-assistant/issues/35)
- Error messages in new design [\#34](https://github.com/cla-assistant/cla-assistant/issues/34)
- changes landingpage [\#33](https://github.com/cla-assistant/cla-assistant/issues/33)
- Options: Choose a CLA in Gist [\#32](https://github.com/cla-assistant/cla-assistant/issues/32)
- Error Boxes [\#31](https://github.com/cla-assistant/cla-assistant/issues/31)
- write PR-comments in name of cla-assistant user [\#27](https://github.com/cla-assistant/cla-assistant/issues/27)
- documentation on how to run own instance of cla assistant [\#26](https://github.com/cla-assistant/cla-assistant/issues/26)
- mention all committers who have not signed CLA yet [\#23](https://github.com/cla-assistant/cla-assistant/issues/23)
- How do I use this? [\#21](https://github.com/cla-assistant/cla-assistant/issues/21)
- Provide capability to query database to see who has accepted the CLA [\#19](https://github.com/cla-assistant/cla-assistant/issues/19)
- provide option to view and revoke CLAs [\#18](https://github.com/cla-assistant/cla-assistant/issues/18)
- Scroll down the CLA [\#17](https://github.com/cla-assistant/cla-assistant/issues/17)
- CLA discovery [\#16](https://github.com/cla-assistant/cla-assistant/issues/16)
- corporate CLAs [\#15](https://github.com/cla-assistant/cla-assistant/issues/15)
- sign cla once per version [\#14](https://github.com/cla-assistant/cla-assistant/issues/14)
- on new version of CLA [\#12](https://github.com/cla-assistant/cla-assistant/issues/12)
- show correct icon for repos and forks [\#11](https://github.com/cla-assistant/cla-assistant/issues/11)
- pull request with multiple committers  [\#10](https://github.com/cla-assistant/cla-assistant/issues/10)
- Names [\#9](https://github.com/cla-assistant/cla-assistant/issues/9)
- Sign-process [\#8](https://github.com/cla-assistant/cla-assistant/issues/8)
- Pull Request Integration [\#7](https://github.com/cla-assistant/cla-assistant/issues/7)
- main page - add gist [\#6](https://github.com/cla-assistant/cla-assistant/issues/6)
- detail-page [\#5](https://github.com/cla-assistant/cla-assistant/issues/5)
- main-page - settings [\#4](https://github.com/cla-assistant/cla-assistant/issues/4)
- main page - add repo [\#3](https://github.com/cla-assistant/cla-assistant/issues/3)
- Logo [\#2](https://github.com/cla-assistant/cla-assistant/issues/2)
- Create marketing page [\#1](https://github.com/cla-assistant/cla-assistant/issues/1)

**Merged pull requests:**

- Bugfix: Consider old style CLA documents without userId [\#298](https://github.com/cla-assistant/cla-assistant/pull/298) ([KharitonOff](https://github.com/KharitonOff))
- 3 bugfixes and 2 features [\#297](https://github.com/cla-assistant/cla-assistant/pull/297) ([MichaelTsengLZ](https://github.com/MichaelTsengLZ))
- Add whitelisting bots section to readme [\#289](https://github.com/cla-assistant/cla-assistant/pull/289) ([greysteil](https://github.com/greysteil))
- Improve code block readability in README.md [\#288](https://github.com/cla-assistant/cla-assistant/pull/288) ([PeterDaveHello](https://github.com/PeterDaveHello))
- Clean up Alpine apk cache in Dockerfile [\#287](https://github.com/cla-assistant/cla-assistant/pull/287) ([PeterDaveHello](https://github.com/PeterDaveHello))
- Travis CI should use nodejs v8 as defined in package.json [\#285](https://github.com/cla-assistant/cla-assistant/pull/285) ([PeterDaveHello](https://github.com/PeterDaveHello))
- Add "Table of Contents" of README to improve readability [\#284](https://github.com/cla-assistant/cla-assistant/pull/284) ([PeterDaveHello](https://github.com/PeterDaveHello))
- Multiple changes to enable bigger repo scale [\#275](https://github.com/cla-assistant/cla-assistant/pull/275) ([MichaelTsengLZ](https://github.com/MichaelTsengLZ))
- change settings via probot [\#271](https://github.com/cla-assistant/cla-assistant/pull/271) ([thojansen](https://github.com/thojansen))
- add commiters automatically to team [\#270](https://github.com/cla-assistant/cla-assistant/pull/270) ([thojansen](https://github.com/thojansen))
- probot integration to ask for more info on pr or issue [\#269](https://github.com/cla-assistant/cla-assistant/pull/269) ([thojansen](https://github.com/thojansen))
- add probot for stale/ inactive issues [\#268](https://github.com/cla-assistant/cla-assistant/pull/268) ([thojansen](https://github.com/thojansen))
- \[Snyk Update\] New fixes for 8 vulnerable dependency paths [\#262](https://github.com/cla-assistant/cla-assistant/pull/262) ([snyk-bot](https://github.com/snyk-bot))
- Add load indicator when getting admin repo, org, gist information. [\#257](https://github.com/cla-assistant/cla-assistant/pull/257) ([MichaelTsengLZ](https://github.com/MichaelTsengLZ))
- Add FAQ pointing to contributoragreements.org [\#254](https://github.com/cla-assistant/cla-assistant/pull/254) ([dltj](https://github.com/dltj))
- Sign only once when multiple orgs or repos lined with the same gist [\#250](https://github.com/cla-assistant/cla-assistant/pull/250) ([MichaelTsengLZ](https://github.com/MichaelTsengLZ))
- Fix link to SAP Individual CLA in README [\#237](https://github.com/cla-assistant/cla-assistant/pull/237) ([sschuberth](https://github.com/sschuberth))
- Cannot remove repo webhook after unlinking a repo. [\#236](https://github.com/cla-assistant/cla-assistant/pull/236) ([MichaelTsengLZ](https://github.com/MichaelTsengLZ))
- \[Snyk Update\] New fixes for 1 vulnerable dependency path [\#231](https://github.com/cla-assistant/cla-assistant/pull/231) ([snyk-bot](https://github.com/snyk-bot))
- Avoid crash when using documentDB to replace mongoDB on Azure. [\#227](https://github.com/cla-assistant/cla-assistant/pull/227) ([MichaelTsengLZ](https://github.com/MichaelTsengLZ))
- Use & concatenation. [\#222](https://github.com/cla-assistant/cla-assistant/pull/222) ([matkoch](https://github.com/matkoch))
- Add customization parameters for label, colorB and logo. [\#219](https://github.com/cla-assistant/cla-assistant/pull/219) ([matkoch](https://github.com/matkoch))
- Add instructions for building and running with docker \(\#210\) [\#216](https://github.com/cla-assistant/cla-assistant/pull/216) ([ketan](https://github.com/ketan))
- Add dockerfile [\#210](https://github.com/cla-assistant/cla-assistant/pull/210) ([ketan](https://github.com/ketan))
- remove RN badge [\#209](https://github.com/cla-assistant/cla-assistant/pull/209) ([thojansen](https://github.com/thojansen))
- Limit admin access to specific GitHub user\(s\) [\#208](https://github.com/cla-assistant/cla-assistant/pull/208) ([ketan](https://github.com/ketan))
- Typo [\#205](https://github.com/cla-assistant/cla-assistant/pull/205) ([thinkingserious](https://github.com/thinkingserious))
- Enable textarea and hidden fields support [\#204](https://github.com/cla-assistant/cla-assistant/pull/204) ([mickaelandrieu](https://github.com/mickaelandrieu))
- Fixed Stickers section [\#203](https://github.com/cla-assistant/cla-assistant/pull/203) ([mickaelandrieu](https://github.com/mickaelandrieu))
- Style changes for CLA signer page. [\#199](https://github.com/cla-assistant/cla-assistant/pull/199) ([kbsriram](https://github.com/kbsriram))
- Check author before committer \(\#2\) [\#171](https://github.com/cla-assistant/cla-assistant/pull/171) ([kborchers](https://github.com/kborchers))
- Reflect mongolab name change in README.md. [\#167](https://github.com/cla-assistant/cla-assistant/pull/167) ([equinox](https://github.com/equinox))
- Update README.md [\#165](https://github.com/cla-assistant/cla-assistant/pull/165) ([ctomc](https://github.com/ctomc))
- Add syntax highlighting on JSON example [\#163](https://github.com/cla-assistant/cla-assistant/pull/163) ([Hirse](https://github.com/Hirse))
- Allowing to specify patterns for ignored repos during org linking [\#162](https://github.com/cla-assistant/cla-assistant/pull/162) ([dennisoelkers](https://github.com/dennisoelkers))
- fix typo [\#139](https://github.com/cla-assistant/cla-assistant/pull/139) ([jdanyow](https://github.com/jdanyow))
- \[Snyk Alert\] Fix for 2 vulnerable dependency paths [\#131](https://github.com/cla-assistant/cla-assistant/pull/131) ([snyk-bot](https://github.com/snyk-bot))
- Error pages [\#127](https://github.com/cla-assistant/cla-assistant/pull/127) ([JNKielmann](https://github.com/JNKielmann))
- Added ping webhook handler [\#126](https://github.com/cla-assistant/cla-assistant/pull/126) ([JNKielmann](https://github.com/JNKielmann))
- Friendlier PR comment for \>1 committer [\#115](https://github.com/cla-assistant/cla-assistant/pull/115) ([laughinghan](https://github.com/laughinghan))
- Friendlier PR comment, helps with \#105 [\#110](https://github.com/cla-assistant/cla-assistant/pull/110) ([laughinghan](https://github.com/laughinghan))
- Remove apostrophe from plural for CLAs [\#90](https://github.com/cla-assistant/cla-assistant/pull/90) ([AshleyGrant](https://github.com/AshleyGrant))
- Refactors DESCRIPTION.md [\#85](https://github.com/cla-assistant/cla-assistant/pull/85) ([casche](https://github.com/casche))
- Welcoming gender neutral contributors [\#84](https://github.com/cla-assistant/cla-assistant/pull/84) ([jstoiko](https://github.com/jstoiko))
- add screenshot to description [\#73](https://github.com/cla-assistant/cla-assistant/pull/73) ([thojansen](https://github.com/thojansen))
- add to github integrations page [\#72](https://github.com/cla-assistant/cla-assistant/pull/72) ([thojansen](https://github.com/thojansen))
- Upload CSV [\#69](https://github.com/cla-assistant/cla-assistant/pull/69) ([dfarr](https://github.com/dfarr))
- fix sign-in link hover color [\#58](https://github.com/cla-assistant/cla-assistant/pull/58) ([matz3](https://github.com/matz3))
- add missing "istanbul" devDependency [\#57](https://github.com/cla-assistant/cla-assistant/pull/57) ([matz3](https://github.com/matz3))
- Fixed a small typo on the front page [\#54](https://github.com/cla-assistant/cla-assistant/pull/54) ([pmn](https://github.com/pmn))
- Update copy [\#50](https://github.com/cla-assistant/cla-assistant/pull/50) ([dfarr](https://github.com/dfarr))
- Ui improvements + higher angular version [\#20](https://github.com/cla-assistant/cla-assistant/pull/20) ([KharitonOff](https://github.com/KharitonOff))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*
