// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

let removeToken = (obj) => {
    try {
        obj = obj.toObject()
        if (obj.token) {
            delete obj.token
        }
    } catch (e) {
        //do nothing
    }

    return obj
}

module.exports = {
    cleanObject: (obj) => {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
            let cleanedObj = []
            obj.forEach(function (el) {
                cleanedObj.push(removeToken(el))
            })

            return cleanedObj
        }

        return removeToken(obj)
    }
}
