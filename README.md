[![Build Status](https://travis-ci.org/cla-assistant/cla-assistant.svg?branch=master)](https://travis-ci.org/cla-assistant/cla-assistant) [![Dependency Status](https://david-dm.org/cla-assistant/cla-assistant.svg)](https://david-dm.org/cla-assistant/cla-assistant) [![devDependency Status](https://david-dm.org/cla-assistant/cla-assistant/dev-status.svg)](https://david-dm.org/cla-assistant/cla-assistant#info=devDependencies) [![Coverage Status](https://img.shields.io/coveralls/cla-assistant/cla-assistant.svg)](https://coveralls.io/r/cla-assistant/cla-assistant)
[![ReviewNinja](https://app.review.ninja/26210598/badge)](https://app.review.ninja/cla-assistant/cla-assistant)

Contributor License Agreement assistant
===
The Contributor License Agreement assistant (CLA assistant) lets you handle the legal side of contributions to your code easily.

All you need to do is to store your CLA as a GitHub Gist file and link it with your repository in the CLA assistant. The remaining part takes CLA assistant for you over:

 - it notifies each contributor to sign the CLA as soon as he or she creates a pull request
 - it lets contributor sign your CLA easily doing few clicks
 - it authenticates the signer with his GitHub account
 - it updates the status of the pull request as soon the contributor agrees to your CLA

If the content of your CLA changes over time you have not to notify all your active contributor to sign the new version of the CLA again. CLA assistant will do it for you! Just update the linked Gist file. Each new pull request will get a comment with request to sign the CLA even if the user has already signed the previous version.

You as repository owner can review the list of users who signed your CLA for each version of it.

Try
====
CLA assistant is provided by SAP as a free hosted offering under: https://cla-assistant.io/. Please leave us a GitHub issue if you have feedback.

For SAP open source projects please use the [SAP Individual Contributor License Agreement] (https://gist.github.com/CLAassistant/bd1ea8ec8aa0357414e8).

FAQ
===
#### Where is the list of signees stored?
We store all the data in a MongoDB hosted by [mongolab](https://mongolab.com/).

#### Where can I see the list of signees? Is there a way to import/export the signee data?
You can see the list of signees on the user interface. There is also a possibility for you to export the list as a .csv file.

#### Who can I contact for help?
In case of problems or any further questions, please open an issue in GitHub. We always appreciate helpful tips and support for the project.


Setup your own instance of CLA assistant
==============================

Clone this repository, change into the cloned directory and install dependencies.

    git clone git@github.com:cla-assistant/cla-assistant.git
    cd ./cla-assistant
    npm install

[Register an application on GitHub](https://github.com/settings/applications/new). The callback URL needs to be of the form

`<PROTOCOL>://<HOST>:<PORT>/auth/github/callback`.

Copy the sample configuration file `.env.example` file to `.env`.

	cp .env.example .env

The following are the environment variables you have to configure to run a private instance:

- `HOST`: This should only set the hostname of your CLA assistant instance (without the protocol).
- `PORT`: The local port to bind to. Defaults to 5000.
- `PROTOCOL`: Valid options are "http" or "https".
- `GITHUB_CLIENT`: From your registered application in GitHub.
- `GITHUB_SECRET`: From your registered application in GitHub.
- `GITHUB_USER`: For CLA assistant to comment on pull requests, it requires a GitHub account.
- `GITHUB_PASS`: To access the GitHub account to comment on pull requests, CLA assistant needs an API Token. It can be generated here https://github.com/settings/tokens/new. The Only scope required is `repo_public`.
- `MONGODB`: This has to be in form of a mongodb url, e.g. `mongodb://<user>:<password>@<host>:<port>/<dbname>`.
- `SLACK_URL`: Optional. You can use it in case you would like to get log-notifications posted in your slack chat.
- `SLACK_TOKEN`: Optional.

> **Hint:** For further reading on setting up MongoDB, go to
> http://docs.mongodb.org/manual/tutorial/getting-started/
> http://docs.mongodb.org/manual/reference/method/db.createUser

Run grunt in order to build the application.

    ./node_modules/grunt-cli/bin/grunt build

During development, just run the grunt default task to build the app, start linter checks and run unit tests on each change of relevant .js files.

    ./node_modules/grunt-cli/bin/grunt

Finally, source the environment file and start the application.

    source .env
    npm start
    
    
License
=======

Contributor License Agreement assistant

Copyright (c) 2014 [SAP SE](http://www.sap.com) or an SAP affiliate company. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Credits
=======

<p align="center">
![SAP](https://raw.githubusercontent.com/reviewninja/review.ninja/master/sap_logo.png)

<p align="center">
:heart: from the GitHub team @ SAP
