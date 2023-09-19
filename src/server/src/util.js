// SPDX-FileCopyrightText: 2023 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    isUserAppAuthenticated: (user) => user && user.token && user.token.startsWith('ghu_')
}
