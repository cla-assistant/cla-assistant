// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const express = require('express');
const router = express.Router();

router.get('/health/readiness', (req, res) => {
  if (!hasValidHealthCheckHeader(req)) {
    return res.status(400).end();
  }

  return res
    .status(200)
    .send('OK')
    .end();
});

function hasValidHealthCheckHeader(req) {
  return req.header('x-health-check') === 'check';
}

module.exports = router;
