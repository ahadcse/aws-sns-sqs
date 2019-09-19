const { POLL_LAMBDA_ARN } = process.env

const pMap = require('p-map')
const lambda = new (require('aws-sdk/clients/lambda'))()
const { getEnabledConfigs } = require('./dbClient')

const invokePollerLambda = (event) => {
  const params = {
    FunctionName: POLL_LAMBDA_ARN,
    LogType: 'None',
    Payload: JSON.stringify(event)
  }
  return lambda.invoke(params).promise()
    .then(() => {
      console.log('Emitting complete', 'handler', { message: 'DONE', event })
    })
    .catch((error) => {
      return Promise.resolve(error.message || error) // Not throwing error cause it will break the concurrency chain
    })
}

const handler = async (event) => {
  console.log('Launching the lambda', { event })
  const frequency = event.frequency || 1
  const targets = await getEnabledConfigs(frequency)
  return pMap(targets, invokePollerLambda, { concurrency: 25 }) // Max number of concurrent triggering.
  // So max that (25) number of lambdas will spin up
}

module.exports = {
  handler
}
