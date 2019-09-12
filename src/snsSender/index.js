const { ENVIRONMENT = 'dev' } = process.env

const { sendSNS } = require('./snsClient')

const handler = async event => {
  console.log('Event that will be sent to sns', { event })
  if(!JSON.parse(event)) {
     return Promise.reject('Event cannot be parsed')
  }
  try {
    await sendSNS(event)
  } catch (e) {
    console.log('Error', e.message || JSON.stringify(e))
  }
}


module.exports = {
  handler
}
