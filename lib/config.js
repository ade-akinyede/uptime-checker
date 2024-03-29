/*
 Create and export configuration variables
*/

// Container for all the environments
const environments = {}

// Staging (default) environment
environments.staging = {
    'httpPort': 3030,
    'httpsPort': 3031,
    'envName': 'staging',
    'hashingSecret': 'stagingSecret38'
}

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'productionSecret59'
}

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : ''

// Check that the current environment is one of the environments above, if not, default to Staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging

// Export the module
module.exports =  environmentToExport
