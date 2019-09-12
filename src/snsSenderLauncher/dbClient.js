const { CONFIG_TABLE_NAME } = process.env
const documentClient = new (require('aws-sdk/clients/dynamodb')).DocumentClient()

const getEnabledTargets = async (rate, lastEvaluatedKey, accumulatedResults = []) => {
  const params = {
    TableName: CONFIG_TABLE_NAME,
    FilterExpression: 'enabled = :enabled AND rate = :rate',
    ExpressionAttributeValues: {
      ':enabled': true,
      ':rate': rate
    }
  }

  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey
  }

  const result = await documentClient.scan(params).promise()
  const totalResults = accumulatedResults.concat(result.Items)

  if (result.LastEvaluatedKey) {
    return getEnabledTargets(result.LastEvaluatedKey, totalResults)
  }

  return totalResults
}

module.exports = {
  getEnabledTargets
}
