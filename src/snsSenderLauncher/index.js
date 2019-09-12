const { POLL_LAMBDA_ARN } = process.env

const pMap = require('p-map')
const lambda = new (require('aws-sdk/clients/lambda'))()

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
      return Promise.resolve(error.message || error) // We don't want to throw here since that will break the concurrency chain
    })
}

const handler = async (event) => {
  console.log('Launching the lambda', 'handler', { event })
  return pMap(event, invokePollerLambda, { concurrency: 25 }) // Max number of concurrent triggering
}

module.exports = {
  handler
}
