'use strict';

// modules
let express = require('express');

let router = express.Router();

router.all('/config', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({
        gacode: config.client.gacode
    }));
});

module.exports = router;
