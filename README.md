[![CLA assistant](https://cla-assistant.io/readme/badge/cla-assistant/cla-assistant)](https://cla-assistant.io/cla-assistant/cla-assistant) [![Build Status](https://travis-ci.org/cla-assistant/cla-assistant.svg?branch=master)](https://travis-ci.org/cla-assistant/cla-assistant) [![Dependency Status](https://david-dm.org/cla-assistant/cla-assistant.svg)](https://david-dm.org/cla-assistant/cla-assistant) [![devDependency Status](https://david-dm.org/cla-assistant/cla-assistant/dev-status.svg)](https://david-dm.org/cla-assistant/cla-assistant#info=devDependencies) [![Coverage Status](https://img.shields.io/coveralls/cla-assistant/cla-assistant.svg)](https://coveralls.io/r/cla-assistant/cla-assistant) [![Code Climate](https://codeclimate.com/github/cla-assistant/cla-assistant/badges/gpa.svg)](https://codeclimate.com/github/cla-assistant/cla-assistant)

[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/1583/badge)](https://bestpractices.coreinfrastructure.org/projects/1583)

Table of Contents
===
- [Contributor License Agreement assistant](#contributor-license-agreement-assistant)
- [Try](#try)
- [Request more information from the CLA signer](#request-more-information-from-the-cla-signer)
- [FAQ](#faq)
- [Setup your own instance of CLA assistant](#setup-your-own-instance-of-cla-assistant)
- [Supported environment variables](#supported-environment-variables)
- [Run the CLA assistant instance with Docker](#run-the-cla-assistant-instance-with-docker)
- [License](#license)
- [Credits](#credits)

Contributor License Agreement assistant
===
Streamline your workflow and let CLA assistant handle the legal side of contributions to a repository for you. CLA assistant enables contributors to sign CLAs from within a pull request.

To get started, simply store your CLA as a GitHub Gist file then link it with the repository/organisation in CLA assistant. Then sit back and relax while CLA assistant:

- Comments on each opened pull request to ask the contributor to sign the CLA
- Allows contributors to sign a CLA from within a pull request
- Authenticates the signee with his or her GitHub account
- Updates the status of a pull request when the contributor agrees to the CLA
- Automatically asks users to re-sign the CLA for each new pull request in the event the associated Gist & CLA has changed

Repository owners can review a list of users who signed the CLA for each version of it. To get started, visit https://cla-assistant.io.

Try
====
CLA assistant is provided by SAP as a free hosted offering under: https://cla-assistant.io/. Please leave us a GitHub issue if you have feedback.

For SAP open source projects please use the [SAP Individual Contributor License Agreement](https://gist.github.com/CLAassistant/bd1ea8ec8aa0357414e8).


Request more information from the CLA signer
===
If you need to collect detailed information about your contributors you can add so called "custom fields" to your CLA.
This can be done by providing CLA assistant with some metadata that describes the data you are going to collect.
CLA assistant will generate a form based on this metadata and contributors will be requested to fill out the form before they sign your CLA.

Following steps need to be done:
 - Go to the Gist with your CLA and add a new file with name "metadata" ([like this](https://raw.githubusercontent.com/cla-assistant/cla-assistant/master/src/client/assets/images/add_custom_fields.gif))
 - describe custom fields in JSON format (according to the [JSON Schema](https://raw.githubusercontent.com/cla-assistant/cla-assistant/master/custom-fields-schema.json))

    ```js
    {
        "name": {
            "title": "Full Name",
            "type": "string",
            "githubKey": "name"
        },
        "email": {
            "title": "E-Mail",
            "type": "string",
            "githubKey": "email",
            "required": true
        },
        "age": {
            "title": "Age",
            "description": "Age in years",
            "type": "number",
            "minimum": 18,
            "maximum": 99
        },
        "agreement": {
            "title": "I have read and agree to the CLA",
            "type": "boolean",
            "required": true
        },
        "category": {
            "title": "How do you sign?",
            "type": {
                "enum": [
                    "I am signing on behalf of myself.",
                    "I am signing on behalf of my employer."
                ]
            },
            "required": true
        }
    }
    ```

You can also define which of required information can be taken from user's GitHub account. In that case CLA assistant prefills the form with GitHub data.
The possible values for the "githubKey"-property can be found in the [GitHub-Api description](https://developer.github.com/v3/users/#get-a-single-user)

FAQ
===
#### Where is the list of signees stored?
We store all the data in a MongoDB hosted by [mLab](https://mlab.com/).

#### Where can I see the list of signees? Is there a way to import/export the signee data?
You can see the list of signees on the user interface. There is also a possibility for you to export the list as a .csv file.

#### What should my Contributor License Agreement say?
We're no lawyers, but we can suggest using http://contributoragreements.org/ for a fill-in-the-blank approach to creating a CLA tailored to your needs.

#### Who can I contact for help?
In case of problems or any further questions, please open an issue in GitHub. We always appreciate helpful tips and support for the project.

#### How can I contribute?
You want to contribute to CLA Assistant? Welcome! Please read [here](https://github.com/cla-assistant/cla-assistant/blob/master/CONTRIBUTING.md).

#### Can I whitelist bot users?
Since there's no way for bot users (such as Dependabot or Greenkeeper) to sign a CLA, you may want to whitelist them. You can do so by importing their names (in this case `dependabot[bot]` and `greenkeeper[bot]`) in the CLA assistant dashboard.


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


Supported environment variables
===============================

The following are the environment variables you have to configure to run a private instance:

- `HOST`: This should only set the hostname of your CLA assistant instance (without the protocol).
- `PORT`: The local port to bind to. Defaults to 5000.
- `HOST_PORT`: You can set the port of your hosted CLA assistant instance here (in case your instnce doesn't use standard http ports like 80 or 443).
- `PROTOCOL`: Valid options are "http" or "https".
- `GITHUB_CLIENT`: From your registered application in GitHub.
- `GITHUB_SECRET`: From your registered application in GitHub.
- `GITHUB_USER`: For CLA assistant to comment on pull requests, it requires a GitHub account.
- `GITHUB_PASS`: Use CLA assistant's user and password for basic authentication (where github_token doesn't work). Use the GITHUB_TOKEN value here in addition to setting GITHUB_TOKEN envirnonment when using github token authentication.
- `GITHUB_TOKEN`: Use GitHub token of CLA assistant's user for API calls of not authenticated users. It can be generated here https://github.com/settings/tokens/new. The Only scope required is `public_repo`.
- `GITHUB_ADMIN_USERS`: (optional, comma-separated) If set, will only allow the specified GitHub users to administer this instance of the app.
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


Run the CLA assistant instance with Docker
==========================================

To run the CLA assistant instance with docker:

```bash
$ docker build -t cla-assistant .
$ docker run -d -p5000:5000 \
      -e HOST=.. \
      -e PORT=... \
      cla-assistant
```

For the list of supported environments see [supported environment variables](#supported-environment-variables)

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
    <img src="https://raw.githubusercontent.com/reviewninja/review.ninja/master/sap_logo.png" title="SAP" />
<p align="center">
:heart: from the GitHub team @ SAP
