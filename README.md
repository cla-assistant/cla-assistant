# cla-assistant
# Contributor License Agreement assistant (CLA assistant)
---
[![CLA assistant](https://cla-assistant.io/readme/badge/cla-assistant/cla-assistant)](https://cla-assistant.io/cla-assistant/cla-assistant) [![Build Status](https://travis-ci.org/cla-assistant/cla-assistant.svg?branch=master)](https://travis-ci.org/cla-assistant/cla-assistant) [![Dependency Status](https://david-dm.org/cla-assistant/cla-assistant.svg)](https://david-dm.org/cla-assistant/cla-assistant) [![devDependency Status](https://david-dm.org/cla-assistant/cla-assistant/dev-status.svg)](https://david-dm.org/cla-assistant/cla-assistant#info=devDependencies) [![Coverage Status](https://img.shields.io/coveralls/cla-assistant/cla-assistant.svg)](https://coveralls.io/r/cla-assistant/cla-assistant) [![Code Climate](https://codeclimate.com/github/cla-assistant/cla-assistant/badges/gpa.svg)](https://codeclimate.com/github/cla-assistant/cla-assistant)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/1583/badge)](https://bestpractices.coreinfrastructure.org/projects/1583)
[![Build Status](https://github.com/ibakshay/cla-assistant/workflows/CI/CDPipeline/badge.svg)](https://github.com/cla-assistant/cla-assistant/actions)
---
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
- Authenticates the signee with their GitHub account
- Updates the status of a pull request when the contributor agrees to the CLA
- Automatically asks users to re-sign the CLA for each new pull request in the event the associated Gist & CLA has changed

Repository owners can review a list of users who signed the CLA for each version of it. To get started, visit https://cla-assistant.io.

We also developed a [lite version](https://github.com/cla-assistant/github-action) of CLA Assistant using GitHub Actions which is in Alpha. You can checkout it out [here](https://github.com/cla-assistant/github-action).

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
