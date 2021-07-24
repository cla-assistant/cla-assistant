Setup your own instance of CLA assistant
Clone this repository, change into the cloned directory and install dependencies.

git clone git@github.com:cla-assistant/cla-assistant.git
cd ./cla-assistant
npm install
Register an application on GitHub. The callback URL needs to be of the form

<PROTOCOL>://<HOST>:<PORT>/auth/github/callback.

You can use ngrok to get a publicly accessible URL which redirects to your localhost:5000 by executing the following command

/ngrok http 5000
If you use ngrok, you need to update the HOST variable in your .env and set PROTOCOL to "https".

Copy the sample configuration file .env.example file to .env.

cp .env.example .env
