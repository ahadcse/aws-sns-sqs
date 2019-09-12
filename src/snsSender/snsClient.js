const sns = new (require('aws-sdk/clients/sns'))()

const sendSNS = (id, resource, payload) => {
  const resourceNoQs = resource.split('?')[0] // Remove query string if any
  const params = {
    TopicArn: process.env.EVENTS_TOPIC_ARN,
    Message: JSON.stringify(payload),
    MessageAttributes: {
      companyId: {
        DataType: 'String',
        StringValue: id
      },
      resource: {
        DataType: 'String',
        StringValue: resourceNoQs
      }
    }
  }
  return sns.publish(params).promise()
}

module.exports = {
  sendSNS
}
