<!--
SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors

SPDX-License-Identifier: Apache-2.0
-->

[![CLA assistant](https://cla-assistant.io/readme/badge/cla-assistant/cla-assistant)](https://cla-assistant.io/cla-assistant/cla-assistant)
[![Coverage Status](https://img.shields.io/coveralls/cla-assistant/cla-assistant.svg)](https://coveralls.io/r/cla-assistant/cla-assistant)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/1583/badge)](https://bestpractices.coreinfrastructure.org/projects/1583)
[![CI/CDPipeline](https://github.com/cla-assistant/cla-assistant/actions/workflows/build.yml/badge.svg)](https://github.com/cla-assistant/cla-assistant/actions/workflows/build.yml)
[![REUSE status](https://api.reuse.software/badge/github.com/cla-assistant/cla-assistant)](https://api.reuse.software/info/github.com/cla-assistant/cla-assistant)

# Contributor License Agreement (CLA) assistant

Streamline your workflow and let CLA assistant handle the legal side of contributions to a repository for you. CLA assistant enables contributors to sign CLAs from within a pull request.

To get started, simply store your CLA as a GitHub Gist file then link it with the repository/organization in CLA assistant. Then sit back and relax while CLA assistant:

- Comments on each opened pull request to ask the contributor to sign the CLA
- Allows contributors to sign a CLA from within a pull request
- Authenticates the signee with their GitHub account
- Updates the status of a pull request when the contributor agrees to the CLA
- Automatically asks users to re-sign the CLA for each new pull request in the event the associated Gist & CLA has changed

Repository owners can review a list of users who signed the CLA for each version of it. To get started, visit [cla-assistant.io](https://cla-assistant.io).

We also developed a [lite version](https://github.com/cla-assistant/github-action) of CLA Assistant using GitHub Actions which is in Alpha. You can checkout it out [here](https://github.com/cla-assistant/github-action).

## Try
CLA assistant is provided by [SAP](https://sap.com) as a free hosted offering under [cla-assistant.io](https://cla-assistant.io).
Please open a GitHub issue if you have feedback.

## Request more information from the CLA signer
If you need to collect detailed information about your contributors you can add so called "custom fields" to your CLA.
This can be done by providing CLA assistant with some metadata that describes the data you are going to collect.
CLA assistant will generate a form based on this metadata and contributors will be requested to fill out the form before they sign your CLA.

Following steps need to be done:
- Go to the Gist with your CLA and add a new file with name "metadata" ([like this](https://raw.githubusercontent.com/cla-assistant/cla-assistant/main/src/client/assets/images/add_custom_fields.gif))
- describe custom fields in JSON format (according to the [JSON Schema](https://raw.githubusercontent.com/cla-assistant/cla-assistant/main/custom-fields-schema.json))

```json
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
The possible values for the "githubKey"-property can be found in the [GitHub-API description](https://developer.github.com/v3/users/#get-a-single-user).

## FAQ
#### Where is the list of signees stored?
Since 27.08.2021 all data is stored in a cosmosDB (mongoDB compatible) hosted on Microsoft Azure in Europe ([#740](https://github.com/cla-assistant/cla-assistant/issues/740)).
Before that all the data was stored in a MongoDB hosted by [mLab](https://mlab.com/).

#### Where can I see the list of signees? Is there a way to import/export the signee data?
You can see the list of signees on the user interface. There is also a possibility for you to export the list as a .csv file.

#### What should my Contributor License Agreement say?
We're no lawyers, but we can suggest using https://contributoragreements.org/ for a fill-in-the-blank approach to creating a CLA tailored to your needs.

#### Who can I contact for help?
In case of problems or any further questions, please check our [general trouble shooting issue](https://github.com/cla-assistant/cla-assistant/issues/567) or [open an issue](https://github.com/cla-assistant/cla-assistant/issues/new). We always appreciate helpful tips and support for the project.

#### How can I contribute?
You want to contribute to CLA Assistant? Welcome! Please read [here](https://github.com/cla-assistant/cla-assistant/blob/main/CONTRIBUTING.md).

#### Can I allow bot user contributions?
Since there's no way for bot users (such as Dependabot or Greenkeeper) to sign a CLA, you may want to allow their contributions without it. You can do so by importing their names (in this case `dependabot[bot]` and `greenkeeper[bot]`) in the CLA assistant dashboard.

## Setup your own instance of CLA assistant

Clone this repository, change into the cloned directory and install dependencies.

```sh
git clone https://github.com/cla-assistant/cla-assistant
cd ./cla-assistant
npm install
```

Please check the `package.json` for the supported and tested versions of node and npm.

[Register an application on GitHub](https://github.com/settings/applications/new).
The callback URL needs to be of the form of `<PROTOCOL>://<HOST>:<PORT>/auth/github/callback`.

You can use ngrok to get a publicly accessible URL which redirects to your localhost:5000 by executing the following command:
```sh
ngrok http 5000
```

If you use ngrok, you need to update the HOST variable in your .env and set PROTOCOL to "https".


Copy the sample configuration file `.env.example` file to `.env`.

```sh
cp .env.example .env
```

You require a MongoDB compatible database as a backend. For development purposes you can run MongoDB in a docker container easily:

```sh
docker run --detach --publish 27017:27017 mongo
```

With that you need to adjust the `MONGODB` environment variable in the `.env` file to `mongodb://localhost:27017/cla_assistant`.

### Supported environment variables


The following are the environment variables you have to configure to run a private instance:

- `HOST`: This should only set the hostname of your CLA assistant instance (without the protocol).
- `PORT`: The local port to bind to. Defaults to 5000.
- `HOST_PORT`: You can set the port of your hosted CLA assistant instance here (in case your instance doesn't use standard http ports like 80 or 443).
- `PROTOCOL`: Valid options are "http" or "https".
- `GITHUB_CLIENT`: From your registered application in GitHub.
- `GITHUB_SECRET`: From your registered application in GitHub.
- `GITHUB_TOKEN`: Use GitHub token of CLA assistant's user for API calls of not authenticated users. It can be generated here https://github.com/settings/tokens/new. The Only scope required is `public_repo`.
- `GITHUB_ADMIN_USERS`: (optional, comma-separated) If set, will only allow the specified GitHub users to administer this instance of the app.
- `MONGODB`: This has to be in form of a mongodb url, e.g. `mongodb://<user>:<password>@<host>:<port>/<dbname>`.
- `SLACK_URL`: Optional. You can use it in case you would like to get log-notifications posted in your slack chat.
- `SLACK_TOKEN`: Optional.
- `REQUEST_TRACE_HEADER_NAME`: Use the value of an HTTP-header to set the name. E.g. the request id set by an ingress controller via `X-Req-Id`. If not set or no HTTP-header is present a random uuid is used.
- `LOG_TRACE_FIELD_NAME`: The log field to log the request id to. Defaults to `req_id`.
- `LOG_TRACE_PREFIX`: A prefix put before the traceId.

> **Hint:** For further reading on setting up MongoDB, check the "[Getting Started](https://docs.mongodb.org/manual/tutorial/getting-started/)" and [`db.createUser()` method](https://docs.mongodb.org/manual/reference/method/db.createUser).

Run grunt in order to build the application.
```sh
./node_modules/grunt-cli/bin/grunt build
```

During development, just run the grunt default task to build the app, start linter checks and run unit tests on each change of relevant .js files.
```sh
./node_modules/grunt-cli/bin/grunt
```

Finally, source the environment file and start the application.

```sh
source .env
npm start
```

### Quick start with Docker Compose
To get a CLA assistant instance quickly up you can as well use Docker compose:

```sh
git clone https://github.com/cla-assistant/cla-assistant
cd ./cla-assistant

cp .env.example .env
# Update GITHUB_CLIENT, GITHUB_SECRET and GITHUB_TOKEN with your values in .env
docker-compose up
```
Now you can navigate to `http://localhost:5000` and access your installation. To locally test webhooks you needs to expose it via e.g. `ngrok` as outlined above.

### Run the CLA assistant instance with Docker

To run the CLA assistant instance with docker:

```bash
$ docker build -t cla-assistant .
$ docker run -d -p5000:5000 \
      -e HOST=.. \
      -e PORT=... \
      cla-assistant
```

For the list of supported environments see [supported environment variables](#supported-environment-variables).

## License

Contributor License Agreement assistant

Copyright (c) 2022 [SAP SE](https://www.sap.com) or an SAP affiliate company. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Credits


<p align="center">
    <img src="https://user-images.githubusercontent.com/43786652/108909769-434e3b00-7625-11eb-9abb-53a5db3a3fa6.png" title="SAP" />
<p align="center">

