README.md

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

# G-CLASS Workflow
TERMS OF SERVICE
If you have landed on this page, it is because you are utilizing the G-Class workflow ADD-On APP. 

The Terms of Services for this ADD-On Application are as follows:

If you have access to this application, you are able to utilize the Google Sheets ADD-On App to assist you for educational and non educational purposes alike.

This APP does NOT collect any of the data you use, make, send, build, or create within any part of the process. This APP was designed to allow anyone to utilize it to help with teaching, learning, and using Google Classroom. 

The purpose of this application is to make the most of your time by doing the following:

Sending Assignments & Announcements - This is done by an initial setup of the sheets to allow you to place specific items into the sheet's cells to make a call to your Google Classroom(s). You will be able to connect to Google Classroom, pull information about what classes you have, and then setup up your sheet(s) to send assignments to the classroom you choose.

Planning out your school year in advance - This is done by creating a dated schedule inside the sheet. 

Curriculum Building - This is done by allowing you to utilize standards and other academic information to call upon this information in a sidebar with checkboxes that easily combine and integrate with the sheet when you use that function.

Drive Items - This connects to your Google Drive and allow you to list all of your documents and folders within a Google Folder as it will pull that information into a sheet to allow you to have access to that information from the spreadsheet. This comes in handy when you want to add links in your curriculum to schedule and send to Google Classroom. This will allow you to get the ID of a Folder and then show the files. 

Create Drive Folders and Files - You can create and organize Google Drive Folders and Files including naming them in advance and creating copies of them within this application.

Sheet Helpers - Sometimes you want to clean your sheet of rows  and unused space as this will help you clean the sheet's rows and/or delete rows.

Forms - You can create Google Forms and store the URL links directly in your sheet to use with the planning of items. The sheet will allow you to pull different options and create multiple forms.

Dynamic Templates - The sheet will allow you use  multiple document templates as it will create options for you to make a document  template and fill out that template as many times as you want from the sheet and email it to yourself or someone else.

# Privacy Policy
The G-Class Workflow Respects your Privacy to the extent of FERPA for publication education, and standards set forth by Google.  With that said and simply put, this application has NO intent to collect ANY information about your specific data, nor is its intent to collect your information or private data.  The only information that may be collected are typical data analytics pertaining to how many times the app was installed, any data pertaining to errors, and other non-sensitive data that only deal with the G-Class Workflows effectiveness for its users. 

FERPA  - The Family Educational Rights and Privacy Act (FERPA) (20 U.S.C. § 1232g; 34 CFR Part 99) is a Federal law that protects the privacy of student education records. The law applies to all schools that receive funds under an applicable program of the U.S. Department of Education.  



ALL of this application's functions including, but not limited to, Sheets, Documents, Drive, Calendar, Slides, and Google Classroom ONLY access the user's information to create items for the user, and NONE of that data is stored inside this application, nor will G-Class Workflow ask for personal information or collect your data. This application is credited by educators for educators with the sole purpose of creating a workflow for educators to send assignments to Google Classroom and spend more time facilitating the student learning process.  Any and ALL information/data utilized with this application will be on the users side with the exception of information the user may send to Google Classroom as this will be between the user and Google Classroom as the G-Class Workflow application needs NONE of your data or information.  

# Version v2 of the Content API is scheduled for sunset on September 30th, 2021. Onboarding to v2 ended on April 30, 2021. To avoid disruptions with your integration, please migrate to v2.1 as soon as possible.
For more information, see Migrating to v2.1 and this blog post.

Home
Products
Ads
Content API for Shopping
Rate and review

Send feedback
Account Statuses API
The Account Statuses API allows you to see the status of your Merchant Center Account or an MCA (multi-client account) and all sub-accounts associated with it.

Merchants who have multiple online stores or brands which are sold on separate websites may choose to have sub-accounts under an MCA.



get
The accountstatuses.get API call allows an MCA account to get account status information for a single sub-account, or a standalone account to get its own account status information.

Use the following API call in order to get the account status information where the merchantId is the MCA account number and accountId is its sub-account.

If the Merchant Center account is not a multi-client account, accountstatuses.get can still return account status information; in this case use the same Merchant Center account number for both parameters in the API call below.

Control which product issues are returned by the accountstatuses.get method by using the destination parameter. When the destination is not specified, the default return response only includes statuses for destination: Shopping.


GET https://shoppingcontent.googleapis.com/content/v2.1/merchantId/accountstatuses/accountId
The following is a sample JSON response for a sub-account that was suspended for a "landing page not working policy" violation.


{
 "kind": "content#accountStatus",
 "accountId": "123456789",
 "websiteClaimed": true,
 "accountLevelIssues": [
  {
   "id": "https://search.google.com/search-console/insights/?"utm_source=search_console&utm_medium=search_console&utm_campaign=search_console_dashboard&resource_id=sc-domain:invest86llc.net
   "title": "Account suspended due to policy violation: landing page not working",
   "country": "US",
   "severity": "critical",
   "documentation": "https://support.google.com/merchants/answer/6150244#wycd-usefulness"
  },
  {
   "id": "missing_ad_words_link",
   "title": "No Google Ads account linked",
   "severity": "error",
   "documentation": "https://support.google.com/merchants/answer/6159060"
  }
 ],
 "products": [
  {
   "channel": "online",
   "destination": "Shopping",
   "country": "US",
   "statistics": {
    "active": "0",
    "pending": "0",
    "disapproved": "5",
    "expiring": "0"
   },
   "itemLevelIssues": [
    {
     "code": "image_link_broken",
     "servability": "disapproved",
     "resolution": "merchant_action",
     "attributeName": "image link",
     "description": "Invalid image [image link]",
     "detail": "Ensure the image is accessible and uses an accepted image format (JPEG, PNG, GIF)",
     "documentation": "https://support.google.com/merchants/answer/6098289",
     "numItems": "2"
    },
    {
     "code": "landing_page_error",
     "servability": "disapproved",
     "resolution": "merchant_action",
     "attributeName": "link",
     "description": "Unavailable desktop landing page",
     "detail": "Update your website or landing page URL to enable access from desktop devices",
     "documentation": "https://support.google.com/merchants/answer/6098155",
     "numItems": "5"
    },
    {
     "code": "missing_condition_microdata",
     "servability": "unaffected",
     "resolution": "merchant_action",
     "description": "Missing or invalid data [condition]",
     "detail": "Add valid structured data markup to your landing page",
     "documentation": "https://support.google.com/merchants/answer/6183460",
     "numItems": "5"
    },
    {
     "code": "mobile_landing_page_error",
     "servability": "disapproved",
     "resolution": "merchant_action",
     "attributeName": "link",
     "description": "Unavailable mobile landing page",
     "detail": "Update your website or landing page URL to enable access from mobile devices",
     "documentation": "https://support.google.com/merchants/answer/6098296",
     "numItems": "3"
    }
   ]
  }
 ]
}
list
The accountstatuses.list API call returns information on all sub-accounts. Use the following API call in order to get the account status information where the merchantId is the account number for a multi-client account.

The accountstatuses.list method also provides the ability to filter product issues by destination. When the destination is not specified, the default return response only includes statuses for destination: Shopping.

GET https://shoppingcontent.googleapis.com/content/v2.1/merchantId/accountstatuses
The following is a sample JSON response:

{
 "kind": "content#accountstatusesListResponse",
 "resources": [
  {
   "kind": "content#accountStatus",
   "accountId": "1234567",
   "websiteClaimed": true,
   "accountLevelIssues": [
    {
     "id": "editorial_and_professional_standards_destination_url_down_policy",
     "title": "Account suspended due to policy violation: landing page not working",
     "country": "US",
     "severity": "critical",
     "documentation": "https://support.google.com/merchants/answer/6150244#wycd-usefulness"
    },
    {
     "id": "missing_ad_words_link",
     "title": "No Google Ads account linked",
     "severity": "error",
     "documentation": "https://support.google.com/merchants/answer/6159060"
    }
   ],
   "products": [
    {
     "channel": "online",
     "destination": "Shopping",
     "country": "US",
     "statistics": {
      "active": "0",
      "pending": "0",
      "disapproved": "0",
      "expiring": "0"
     }
    }
   ]
  },
  {
   "kind": "content#accountStatus",
   "accountId": "123456789",
   "websiteClaimed": true,
   "accountLevelIssues": [
    {
     "id": "home_page_issue",
     "title": "Website URL not provided",
     "severity": "critical",
     "documentation": "https://support.google.com/merchants/answer/176793"
    },
    {
     "id": "missing_ad_words_link",
     "title": "No Google Ads account linked",
     "severity": "error",
     "documentation": "https://support.google.com/merchants/answer/6159060"
    }
   ],
   "products": [
    {
     "channel": "online",
     "destination": "Shopping",
     "country": "US",
     "statistics": {
      "active": "0",
      "pending": "0",
      "disapproved": "0",
      "expiring": "0"
     }
    }
   ]
  }
 ]
}
A call to the accountstatuses.list for a non-MCA account (for example, a standalone Merchant Center account) returns a 403 error, with a JSON body similar to this:

{
 "error": {
  "errors": [
   {
    "domain": "global",
    "reason": "forbidden",
    "message": "111111111 is not a multi-client account (MCA). The only account
                service operations allowed on non-MCAs are 'get', 'update',
                'authinfo' and 'claimwebsite'."
   }
  ],
  "code": 403,
  "message": "111111111 is not a multi-client account (MCA). The only account
              service operations allowed on non-MCAs are 'get', 'update',
              'authinfo' and 'claimwebsite'."
 }
}
Batch mode
An accountstatuses.custombatch with a GET method returns account status information for multiple sub-accounts in a multi-client account.

The request JSON includes the merchantId of the MCA account number, the accountId of the sub-account, a unique batchId and the method set to get.

POST https://shoppingcontent.googleapis.com/content/v2.1/accountstatuses/batch
The following is a sample request JSON body:

{
  "entries": [
    {
      "accountId": 1212121212,
      "merchantId": 4444444444,
      "method": "get",
      "batchId": 9
    },
    {
      "accountId": 1313131313,
      "merchantId": 4444444444,
      "method": "get",
      "batchId": 99
    }
  ]
}
The following is a sample JSON response body:

{
 "kind": "content#accountstatusesCustomBatchResponse",
 "entries": [
  {
   "batchId": 9,
   "accountStatus": {
    "kind": "content#accountStatus",
    "accountId": "1212121212",
    "websiteClaimed": true,
    "accountLevelIssues": [
     {
      "id": "home_page_issue",
      "title": "Website URL not provided",
      "severity": "critical",
      "documentation": "https://support.google.com/merchants/answer/176793"
     },
     {
      "id": "missing_ad_words_link",
      "title": "No Google Ads account linked",
      "severity": "error",
      "documentation": "https://support.google.com/merchants/answer/6159060"
     }
    ],
    "products": [
     {
      "channel": "online",
      "destination": "Shopping",
      "country": "US",
      "statistics": {
       "active": "0",
       "pending": "0",
       "disapproved": "0",
       "expiring": "0"
      }
     }
    ]
   }
  },
  {
   "batchId": 99,
   "accountStatus": {
    "kind": "content#accountStatus",
    "accountId": "1313131313",
    "websiteClaimed": true,
    "accountLevelIssues": [
     {
      "id": "editorial_and_professional_standards_destination_url_down_policy",
      "title": "Account suspended due to policy violation: landing page not working",
      "country": "US",
      "severity": "critical",
      "documentation": "https://support.google.com/merchants/answer/6150244#wycd-usefulness"
     },
     {
      "id": "missing_ad_words_link",
      "title": "No Google Ads account linked",
      "severity": "error",
      "documentation": "https://support.google.com/merchants/answer/6159060"
     }
    ],
    "products": [
     {
      "channel": "online",
      "destination": "Shopping",
      "country": "US",
      "statistics": {
       "active": "0",
       "pending": "0",
       "disapproved": "0",
       "expiring": "0"
      }
     }
    ]
   }
  }
 ]
}
Changes from v2 to v2.1
In the AccountStatus resource, dataQualityIssues has been superseded by itemLevelIssues. For more information on updating your application for v2.1, see Migrating from Content API v2 to v2.1.

Testing the accountstatuses API
These test examples use base_url to refer to https://www.googleapis.com. In addition, all examples use /content/v2 in the URL in a production environment. To test API v2.1, you would instead use /content/v2.1.

In the following example we get, list, and custombatch.get account status for MCA accounts:

Get sub-account status for an MCA using accountstatuses.get.

Get the merchantId and accountId by performing a GET to the API endpoint:

GET https://shoppingcontent.googleapis.com/content/v2.1/merchantId/accountstatuses/accountId
You should receive an HTTP 200 status code for success and the account status list in JSON.

View all sub-account status for an MCA using accountstatuses.list.

Perform a GET to the API endpoint with your merchantId:

GET https://shoppingcontent.googleapis.com/content/v2.1/merchantId/accountstatuses
You should receive an HTTP 200 status code for success and the account status list in JSON for the merchantId submitted.

View multiple sub-accounts for MCA in batch mode using accountstatuses.custombatch.

Construct valid JSON using your accountID, merchant ID, and a get method.

Perform a POST to the API endpoint:

POST https://shoppingcontent.googleapis.com/content/v2.1/accountstatuses/batch
You should receive an HTTP 200 status code for success and the account status list in JSON.

Rate and review

Send feedback
Except as otherwise noted, the content of this page is licensed under the Creative Commons Attribution 4.0 License, and code samples are licensed under the Apache 2.0 License. For details, see the Google Developers Site Policies. Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2021-02-12 UTC.

BlogBlog
Tools
Downloads
Reference Docs
Product Info
Terms of Service
Developer consoles
Google API Console
Google Cloud Platform Console
Google Play Console
Firebase Console
Actions on Google Console
Cast SDK Developer Console
Chrome Web Store Dashboard
Google Developers
Android
Chrome
Firebase
Google Cloud Platform
All products
Terms
Privacy
Sign up for the Google Developers newsletter
Subscribe
Language



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
In case of problems or any further questions, please check our [general trouble shooting issue](https://github.com/cla-assistant/cla-assistant/issues/567) or [open an issue](https://github.com/cla-assistant/cla-assistant/issues/new). We always appreciate helpful tips and support for the project.

#### How can I contribute?
You want to contribute to CLA Assistant? Welcome! Please read [here](https://github.com/cla-assistant/cla-assistant/blob/master/CONTRIBUTING.md).

#### Can I allow bot user contributions?
Since there's no way for bot users (such as Dependabot or Greenkeeper) to sign a CLA, you may want to allow their contributions without it. You can do so by importing their names (in this case `dependabot[bot]` and `greenkeeper[bot]`) in the CLA assistant dashboard.

Setup your own instance of CLA assistant
==============================

Clone this repository, change into the cloned directory and install dependencies.

    git clone git@github.com:cla-assistant/cla-assistant.git
    cd ./cla-assistant
    npm install

[Register an application on GitHub](https://github.com/settings/applications/new). The callback URL needs to be of the form

`<PROTOCOL>://<HOST>:<PORT>/auth/github/callback`.


You can use ngrok to get a publicly accessible URL which redirects to your localhost:5000 by executing the following command 
```sh
/ngrok http 5000
```  

If you use ngrok, you need to update the HOST variable in your .env and set PROTOCOL to "https".


Copy the sample configuration file `.env.example` file to `.env`.

	cp .env.example .env


Supported environment variables
===============================

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

Copyright (c) 2020 [SAP SE](http://www.sap.com) or an SAP affiliate company. All rights reserved.

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
    <img src="https://user-images.githubusercontent.com/43786652/108909769-434e3b00-7625-11eb-9abb-53a5db3a3fa6.png" title="SAP" />
<p align="center">

