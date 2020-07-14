const express = require('express')
const app = express()
const compression = require('compression')
app.use(compression())
app.use(express.static('public'))
app.use(require('./server').default)
const port = 4000
app.listen(port)
console.log(`Start serving on port ${port}`)
