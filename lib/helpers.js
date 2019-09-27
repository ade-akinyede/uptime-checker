/*
 Helpers for various tasks
*/

// Dependencies
const crypto = require('crypto')
const config = require('./config')


// Container for all the helpers
const helpers = {}

// Create the SHA256 hash
helpers.hash = function(str) {
    if(typeof(str) == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
        return hash
    } else {
        return false
    }
}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
    try {
        const obj = JSON.parse(str)
        return obj
    } catch(e) {
        return {}
    }
}

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = function(strLength) {
    strLength == typeof(strLength) == 'number' && strLength > 0 ? strLength : false

    if(strLength) {
        // Define all possible characters that could go into the string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTWXYZ0123466789'
        // Start the final string
        let str = ''
        for(i = 1; i <= strLength; i++) {
            // Get random character from the possible characters string
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
            // Append this character to the final string
            str += randomCharacter
        }

        return str
    } else {
        return false
    }
}

module.exports = helpers
