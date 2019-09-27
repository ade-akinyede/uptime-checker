/*
 Library for storing and editing data
*/

// Dependencies
const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

// Container for the module (to be exported)
const lib = {}

// Base data directory
lib.baseDir = path.join(__dirname, '/../.data/')

// Create a function for writing data
lib.create = function(dir, file, data, callback) {
    // Try to open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // Convert data to string
            const stringData = JSON.stringify(data)

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if(!err) {
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false)
                        } else{
                            callback('Error closing file.')
                        }
                    })
                } else {
                    callback('Error writing to new file.')
                }
            })
        } else{
            callback('Could not create new file, it may already exist')
            console.log('File error: ', err)
        }
    })
}

// Read function for reading from a file
lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function(err, data) {
        if(!err && data) {
            const parsedData = helpers.parseJsonToObject(data)
            callback(false, parsedData)
        } else {
            callback(err, data)
        }

    })
}

// Update existing file with new data
lib.update = function(dir, file, data, callback) {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // Convert data to string
            const stringData = JSON.stringify(data)

            // Truncate the file
            fs.ftruncate(fileDescriptor, function(err) {
                if(!err) {
                    // Write to the file and close it
                    fs.write(fileDescriptor, stringData, function(err) {
                        if(!err) {
                            fs.close(fileDescriptor, function(err) {
                                if(!err) {
                                    callback(false)
                                } else{
                                    callback('Error closing file.')
                                }
                            })
                        } else{
                            callback('Error writing to file for update.')
                        }
                    })
                } else {
                    callback('Error truncating file.')
                }
            })
        } else{
            callback('Could not open the file for updating, it may not exist yet')
            console.log('File error: ', err)
        }
    })
}

lib.delete = function(dir, file, callback) {
    // Unlink the file
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err) {
        if(!err) {
            callback(false)
        } else{
            callback('Error deleting file')
        }
    })
}

// Export the module]
module.exports = lib
