README.md
## '#$*'_CLA assistant Build Status Dependency Status devDependency Status Coverage Status Code Climate CII Best Practices Build Status

Table of Contents
Contributor License Agreement assistant
Try
Request more information from the CLA signer
FAQ
Setup your own instance of CLA assistant
Supported environment variables
Run the CLA assistant instance with Docker
License
Credits
Contributor License Agreement assistant
Streamline your workflow and let CLA assistant handle the legal side of contributions to a repository for you. CLA assistant enables contributors to sign CLAs from within a pull request.

To get started, simply store your CLA as a GitHub Gist file then link it with the repository/organisation in CLA assistant. Then sit back and relax while CLA assistant:

Comments on each opened pull request to ask the contributor to sign the CLA
Allows contributors to sign a CLA from within a pull request
Authenticates the signee with their GitHub account
Updates the status of a pull request when the contributor agrees to the CLA
Automatically asks users to re-sign the CLA for each new pull request in the event the associated Gist & CLA has changed
Repository owners can review a list of users who signed the CLA for each version of it. To get started, visit https://cla-assistant.io.

We also developed a lite version of CLA Assistant using GitHub Actions which is in Alpha. You can checkout it out here.

Try
CLA assistant is provided by SAP as a free hosted offering under: https://cla-assistant.io/. Please leave us a GitHub issue if you have feedback.

For SAP open source projects please use the SAP Individual Contributor License Agreement.

Request more information from the CLA signer
If you need to collect detailed information about your contributors you can add so called "custom fields" to your CLA. This can be done by providing CLA assistant with some metadata that describes the data you are going to collect. CLA assistant will generate a form based on this metadata and contributors will be requested to fill out the form before they sign your CLA.

Following steps need to be done:

Go to the Gist with your CLA and add a new file with name "metadata" (like this)

describe custom fields in JSON format (according to the JSON Schema)

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
You can also define which of required information can be taken from user's GitHub account. In that case CLA assistant prefills the form with GitHub data. The possible values for the "githubKey"-property can be found in the GitHub-Api description
