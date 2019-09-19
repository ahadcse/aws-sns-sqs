const sns = new (require('aws-sdk/clients/sns'))()

const sendSNS = (event) => {
  const params = {
    TopicArn: process.env.EVENTS_TOPIC_ARN,
    Message: JSON.stringify(event),
    MessageAttributes: {
      userId: {
        DataType: 'String',
        StringValue: event.userId
      },
      resource: {
        DataType: 'String',
        StringValue: event.resource
      }
    }
  }
  return sns.publish(params).promise()
}

module.exports = {
  sendSNS
}
