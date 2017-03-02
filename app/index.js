'use strict'

const http = require('http')
const r = require('rethinkdb')
require('rethinkdb-init')(r)
const Moniker = require('moniker')
const axios = require('axios').create({ timeout: 500 })
const nameGenerator = Moniker.generator([Moniker.adjective, Moniker.noun])
const GITHUB_TOKEN = Buffer.from(process.env.GITHUB_TOKEN, 'base64').toString()

const port = parseInt(process.env.PORT || 80, 10)

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'})
  r.init({
    host: process.env.RETHINKDB_HOST,
    db: process.env.DB_NAME || 'kubernetes_demo'
  }, [
    'visits',
  ])
    .then((conn) => {
      return Promise.all([
        axios.get(`https://api.github.com/user?access_token=${GITHUB_TOKEN}`).catch(()=> null),
        r.table('visits').insert({ name: nameGenerator.choose(), time: r.now() }, { returnChanges: true }).run(conn),
        r.table('visits').orderBy(r.desc('time')).limit(10).coerceTo('array').run(conn)
      ])
    })
    .then(function (result) {
      const visit = result[1].changes[0].new_val
      console.log('Visit:', visit)
      res.end(JSON.stringify({
        message: 'Welcome to Kubernetes',
        github_user: result[0] && result[0].data.login,
        current_visit: visit,
        visits: result[2],
      }))
    })
    .catch(err => {
      console.log({ err })
      res.end(JSON.stringify({ err }))
    })
}).listen(port)
console.log(`Start listening on port ${port}`)
