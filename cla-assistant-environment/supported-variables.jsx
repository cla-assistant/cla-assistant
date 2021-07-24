Supported environment variables
The following are the environment variables you have to configure to run a private instance:

HOST: This should only set the hostname of your CLA assistant instance (without the protocol).
PORT: The local port to bind to. Defaults to 5000.
HOST_PORT: You can set the port of your hosted CLA assistant instance here (in case your instance doesn't use standard http ports like 80 or 443).
PROTOCOL: Valid options are "http" or "https".
GITHUB_CLIENT: From your registered application in GitHub.
GITHUB_SECRET: From your registered application in GitHub.
GITHUB_TOKEN: Use GitHub token of CLA assistant's user for API calls of not authenticated users. It can be generated here https://github.com/settings/tokens/new. The Only scope required is public_repo.
GITHUB_ADMIN_USERS: (optional, comma-separated) If set, will only allow the specified GitHub users to administer this instance of the app.
MONGODB: This has to be in form of a mongodb url, e.g. mongodb://<user>:<password>@<host>:<port>/<dbname>.
SLACK_URL: Optional. You can use it in case you would like to get log-notifications posted in your slack chat.
SLACK_TOKEN: Optional.
Hint: For further reading on setting up MongoDB, go to http://docs.mongodb.org/manual/tutorial/getting-started/ http://docs.mongodb.org/manual/reference/method/db.createUser

Run grunt in order to build the application.

./node_modules/grunt-cli/bin/grunt build
During development, just run the grunt default task to build the app, start linter checks and run unit tests on each change of relevant .js files.

./node_modules/grunt-cli/bin/grunt
Finally, source the environment file and start the application.

source .env
npm start
