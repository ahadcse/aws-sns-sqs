const { CONFIG_TABLE_NAME } = process.env
const documentClient = new (require('aws-sdk/clients/dynamodb')).DocumentClient()

const getEnabledConfigs = async (frequency, lastEvaluatedKey, accumulatedResults = []) => {
  const params = {
    TableName: CONFIG_TABLE_NAME,
    FilterExpression: 'enabled = :enabled AND frequency = :frequency',
    ExpressionAttributeValues: {
      ':enabled': true,
      ':frequency': frequency
    }
  }

  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey
  }

  const result = await documentClient.scan(params).promise()
  const totalResults = accumulatedResults.concat(result.Items)

  if (result.LastEvaluatedKey) {
    return getEnabledConfigs(result.LastEvaluatedKey, totalResults)
  }

  return totalResults
}

module.exports = {
  getEnabledConfigs
}
