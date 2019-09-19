/* eslint new-parens: off */
/* eslint no-console: off */
/* eslint no-unused-vars: off */
const fs = require('fs')
const documentClient = new (require('aws-sdk/clients/dynamodb')).DocumentClient({
  region: process.argv[2] ? process.argv[2] : 'eu-west-1'
})
const env = process.env.ENVIRONMENT || 'dev'
const TableName = process.argv[3] ? process.argv[3] : 'aws-sns-sqs-config'

const getConfigFromDB = async (lastEvaluatedKey, accumulatedResults = []) => {
  const params = {
    TableName
  }

  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey
  }

  const result = await documentClient.scan(params).promise()
  const totalResults = accumulatedResults.concat(result.Items)

  if (result.LastEvaluatedKey) {
    return getConfigFromDB(result.LastEvaluatedKey, totalResults)
  }

  return totalResults
}

const deleteFromDB = async (configs) => {
  for (const { userId, resource } of configs) {
    const params = {
      TableName,
      Key: {
        userId,
        resource
      }
    }
    await documentClient.delete(params).promise()
  }
}

const putConfig = async () => {
  const files = fs.readdirSync(`${__dirname}/../config/${env}/`)
  for (const file of files) {
    const config = require(`../config/${env}/${file}`)
    const userId = file.match(/([\d]{2}).json/)[1]
    const userIsDisabled = config.enabled === false
    console.log(`Deploying config for user: ${userId}`)
    for (const { resource, type, enabled, frequency } of config.resources) {
      const scheduledFrequency = (frequency === 10 || frequency === 60) ? frequency : 1
      const params = {
        TableName,
        Item: {
          userId,
          resource,
          enabled: userIsDisabled ? false : enabled,
          type,
          frequency: scheduledFrequency
        }
      }
      await documentClient.put(params).promise()
    }
  }
}

const deployConfig = async () => {
  const oldConfigs = await getConfigFromDB()
  await deleteFromDB(oldConfigs)
  await putConfig()
}

deployConfig()
  .then(() => {
    console.log('Config/s deployed successfully')
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
