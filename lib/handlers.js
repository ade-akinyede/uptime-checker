/*
 These are the request handlers
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers')

// Helper methods
const methodParser = function(data, callback, handlerContainer) {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers[handlerContainer][data.method](data, callback)
    } else {
        callback(405)
    }
}

const validator = function(param, data="") {
    if(typeof(data) == 'string') {
        data = data.trim()
    }
    return typeof(data) == param.type && param.isValid(data) ? data : false
}

const callbackError = function(errorType, errorObject, callback) {

}

// Define the handler parameters
const USERS_PARAMS = {
    firstName: {type: 'string', isValid: (data) => data.length > 0},
    lastName: {type: 'string', isValid: (data) => data.length > 0},
    phone: {type: 'string', isValid: (data) => data.length >= 10},
    password: {type: 'string', isValid: (data) => data.length > 0},
    tosAgreement: {type: 'boolean', isValid: (data) => data == true}
}

const TOKENS_PARAMS = {
    id: {type: 'string', isValid: (data) => data.length == 20},
    extend: {type: 'boolean', isValid: (data) => data == true}
}

// Define the handlers
const handlers = {}

const initializeHandlers = function() {
    const HANDLERS = []
}

// Users
handlers.users = function(data, callback) {
    methodParser(data, callback, '_users')
}

// Tokens
handlers.tokens = function(data, callback) {
    methodParser(data, callback, '_tokens')
}

// checks
handlers.checks = function(data, callback) {
    methodParser(data, callback, '_checks')
}

// Container for the defined handler submethods
handlers._users = {}
// Container for all the tokens methods
handlers._tokens = {}

// Users - post
handlers._users.post = function(data, callback) {
    const firstName = validator(USERS_PARAMS.firstName, data.payload.firstName)
    const lastName = validator(USERS_PARAMS.lastName, data.payload.lastName)
    const phone = validator(USERS_PARAMS.phone, data.payload.phone)
    const password = validator(USERS_PARAMS.password, data.payload.password)
    const tosAgreement = validator(USERS_PARAMS.tosAgreement, data.payload.tosAgreement)

    if(firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist
        _data.read('users', phone, function(err, data) {
            if(err) {
                // Hash the password
                const hashedPassword = helpers.hash(password)

                if(hashedPassword) {
                    // Create the user queryStringObject
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement
                    }

                    _data.create('users', phone, userObject, function(err) {
                        if(!err) {
                            callback(200)
                        } else {
                            console.log(err)
                            callback(500, {'Error': 'Could not create the new user'})
                        }
                    })
                } else {
                    callback(500, {'Error': 'Could not hash the user password'})
                }
            } else{
                // User already exists
                callback(400, {'Error': 'User already exists'})
            }
        })

    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
    // Check that the phone number is provided
    const phone = validator(USERS_PARAMS.phone, data.queryStringObject.phone)

    if(phone) {
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(data.headers.token, phone, callback, function() {
            // Lookup the user
            _data.read('users', phone, function(err, userData) {
                if(!err && userData) {
                    // Remove the hashedPassword from the user object before returning to the requester
                    delete userData.hashedPassword
                    callback(200, userData)
                } else {
                    callback(404, {'Error': 'Cannot find user or user does not exist'})
                }
            })
        })
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password(at least one must be specified)
handlers._users.put = function(data, callback) {
    // Check for the required field, phone number, is provided
    const phone = validator(USERS_PARAMS.phone, data.payload.phone)

    // Check for the optional fields
    const firstName = validator(USERS_PARAMS.firstName, data.payload.firstName)
    const lastName = validator(USERS_PARAMS.lastName, data.payload.lastName)
    const password = validator(USERS_PARAMS.password, data.payload.password)

    if(phone && (firstName || lastName || password)) {
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(data.headers.token, phone, callback, function() {
            // Lookup the user
            _data.read('users', phone, function(err, userData) {
                if(!err && userData) {
                    // Update the fields necessary
                    if(firstName) {
                        userData.firstName = firstName
                    }
                    if(lastName) {
                        userData.lastName = lastName
                    }
                    if(password) {
                        userData.hashedPassword = helpers.hash(password)
                    }

                    // Store the new updates
                    _data.update('users', phone, userData, function(err) {
                        if(!err) {
                            callback(200)
                        } else {
                            console.log(err)
                            callback(500, {'Error': 'Could not update the user'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'Cannot find user or user does not exist'})
                }
            })
        })
    } else {
        callback(400, {'Error': `${phone ? 'Missing fields to update' : 'Missing required fields'}`})
    }
}

// Users - delete
// Required data: phone
// TODO: Cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback) {
    // Check that the phone number is provided
    const phone = validator(USERS_PARAMS.phone, data.queryStringObject.phone)

    if(phone) {
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(data.headers.token, phone, callback, function() {
            // Lookup the user
            _data.read('users', phone, function(err, userData) {
                if(!err && userData) {
                    _data.delete('users', phone, function(err) {
                        if(!err) {
                            callback(200)
                        } else{
                            callback(500, {'Error': 'Could not delete the specified user'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'Cannot find user or user does not exist'})
                }
            })
        })
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
    const phone = validator(USERS_PARAMS.phone, data.payload.phone)
    const password = validator(USERS_PARAMS.password, data.payload.password)

    if(phone && password) {
        // Lookup the user
        _data.read('users', phone, function(err, userData) {
            if(!err && userData) {
                const hashedPassword = helpers.hash(password)
                if(hashedPassword == userData.hashedPassword) {
                    // Create new token with random name.
                    // Set expiration date to 1 hr in the future.
                    const tokenId = helpers.createRandomString(20)
                    let expires = Date.now() + (1000 * 60 * 60)
                    console.log("Data now", Date.now())
                    const tokenObject = {
                        phone,
                        tokenId,
                        expires
                    }

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err) {
                        if(!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, {'Error': 'Could not create the new token'})
                        }
                    })

                } else {
                    callback(500, {'Error': 'Password did not match the specified user\'s stored password'})
                }
            } else {
                callback(400, {'Error': 'Cannot find user or user does not exist'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data, callback) {
    // Check that the id is valid
    const tokenId = validator(TOKENS_PARAMS.id, data.queryStringObject.id)

    if(tokenId) {
        // Lookup the token
        _data.read('tokens', tokenId, function(err, tokenData) {
            if(!err && tokenData) {
                callback(200, tokenData)
            } else {
                callback(400, {'Error': 'Invalid token'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback) {
    const tokenId = validator(TOKENS_PARAMS.id, data.payload.id)
    const shouldExtend = validator(TOKENS_PARAMS.extend, data.payload.extend)

    if(tokenId && shouldExtend) {
        // Lookup the token
        _data.read('tokens', tokenId, function(err, tokenData) {
            if(!err && tokenData) {
                // Check to make sure the token isn't already expired
                if(tokenData.expires > Date.now()) {
                    // Set the expiration 1hr from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60

                    // Store the new updates
                    _data.update('tokens', tokenId, tokenData, function(err) {
                        if(!err) {
                            callback(200, tokenData)
                        } else {
                            callback(500, {'Error': 'Could not update token\'s expiration'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'The token has already expired and cannot be extended'})
                }
            } else {
                callback(400, {'Error': 'Invalid token'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field(s) or field(s) invalid'})
    }
}

// Tokens - delete
// Required: data: id
// Optional: data: none
handlers._tokens.delete = function(data, callback) {
    // Check that the token id is provided
    const tokenId = validator(TOKENS_PARAMS.id, data.queryStringObject.id)

    if(tokenId) {
        // Lookup the token
        _data.read('tokens', tokenId, function(err, tokenData) {
            if(!err && tokenData) {
                _data.delete('tokens', tokenId, function(err) {
                    if(!err) {
                        callback(200)
                    } else {
                        callback(500, {'Error': 'Could not delete token'})
                    }
                })
            } else {
                callback(400, {'Error': 'Invalid token'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field(s) or field(s) invalid'})
    }
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(tokenId, phone, invalidTokenCallback, validTokenCallback) {
    // Get the token from the headers
    tokenId = typeof(tokenId) == 'string' ? tokenId : false
    // Lookup the token
    _data.read('tokens', tokenId, function(err, tokenData) {
        let isValid = false
        if(!err && tokenData) {
            console.log('no err and valid tokenData')
            // Check that the token is for the given user and has not expired
            if(tokenData.phone == phone && tokenData.expires > Date.now()) {
                isValid = true
            } else{
                console.log('phone and expires failed')
                console.log('tokenData.phone', tokenData.phone)
                console.log('phone', phone)
                console.log('tokenData.expires > Date.now()',tokenData.expires > Date.now())
            }
        }

        if(isValid) {
            validTokenCallback(true)
        } else {
            invalidTokenCallback(403, {'Error': 'Missing required token in header, or token is invalid'})
        }
    })
}

// Ping handler
handlers.ping = function(data, callback) {
    callback(200)
}

// Ping handler
handlers.hello = function(data, callback) {
    let response = `Hi, I received ${data.payload ? "payload" : "no payload"} from you.`
    callback(200, {response, payload: data.payload })
}

// Not found handlers
handlers.notFound = function(data, callback) {
    callback(404)
}

module.exports = handlers
