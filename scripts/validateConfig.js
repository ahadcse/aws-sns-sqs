/* eslint new-parens: off */
/* eslint no-console: off */
const ajv = new (require('ajv'))
const fs = require('fs')
const envs = ['dev', 'test', 'prod']
const validate = ajv.compile(require('../schemas/config.json'))

for (const e of envs) {
  const files = fs.readdirSync(`${__dirname}/../config/${e}/`)
  for (const file of files) {
    const valid = validate(require(`../config/${e}/${file}`))
    if (!valid) {
      console.log(`Validation failed for config: ${e.toUpperCase()}`)
      console.log(JSON.stringify(validate.errors, null, '  '))
      process.exit(1)
    }
  }
}

console.log('Successfully validated configs')
