const { ENVIRONMENT = 'dev' } = process.env

const { sendSNS } = require('./snsClient')

const handler = async event => {
  console.log('Event that will be sent to sns', { event })
  try {
    JSON.parse(event)
  } catch (e) {
    throw new Error('Event cannot be parsed')
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
