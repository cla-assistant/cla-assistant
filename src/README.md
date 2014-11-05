
Feature Branch

Start a feature

    git checkout -b feature/foo master

Finish a feature

    git push origin feature/foo

    open a pull request from feature/foo to master

Structure

    |-- src
    |   |-- bower
    |   |   |-- bower component
    |   |   |-- ...
    |   |-- client
    |   |   |-- controller
    |   |   |   |-- angular controller
    |   |   |   |-- ...
    |   |   |-- directives
    |   |   |   |-- angular directive
    |   |   |   |-- ...
    |   |   |-- templates
    |   |   |   |-- html template
    |   |   |   |-- ...
    |   |   |-- index.html
    |   |-- server
    |   |   |-- api
    |   |   |   |-- api
    |   |   |   |-- ...
    |   |   |-- approval
    |   |   |   |-- default
    |   |   |   |-- ...
    |   |   |-- controller
    |   |   |   |-- controller
    |   |   |   |-- ...
    |   |   |-- documents
    |   |   |   |-- mongoose documents
    |   |   |   |-- ...
    |   |   |-- middleware
    |   |   |   |-- middleware
    |   |   |   |-- ...
    |   |   |-- passports
    |   |   |   |-- authentication strategy
    |   |   |   |-- ...
    |   |   |-- services
    |   |   |   |-- utility
    |   |   |   |-- ...
    |   |   |-- webhooks
    |   |   |   |-- github webhook
    |   |   |   |-- ...
    |   |   |-- app.js    
    |   |-- tests
    |   |   |-- client
    |   |   |   |-- client tests
    |   |   |   |-- ...
    |   |   |-- server
    |   |   |   |-- server tests
    |   |   |   |-- ...
    |-- .gitignore
    |-- .travis.yml
    |-- app.js
    |-- Gruntfile.js
    |-- package.json

Bot Json

    {
        "comments": [{
            "head": head, 
            "body": body,
            "path": file-path,
            "line": line-number,
        },
        ...
        ],
        "issues": [{
            "head": head, 
            "body": body,
            "path": file-path,
            "line": line-number,
         },
        ...
        ],
        vote: "+1"
    }