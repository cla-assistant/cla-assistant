#!/bin/bash

# Download cf command line client
wget -O - https://cli.run.pivotal.io/stable\?release\=linux64-binary\&source\=github | tar xvz -C .

if [ $1 = "cla-assistant-feature" ]
    then
    ./cf login -a https://api.run.pivotal.io -u $CF2_USER -p $CF2_PASS
    else
    ./cf login -a https://api.run.pivotal.io -u $CF_USER -p $CF_PASS
fi

echo $1

./cf push $1 -c "node app.js" -s cflinuxfs3 --no-manifest