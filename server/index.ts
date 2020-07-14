// import { DefaultState, Context } from 'koa'
// import Router from 'koa-router'
// import bodyParser from 'koa-bodyparser'
// import send from 'koa-send'
import express from 'express'
import bodyParser from 'body-parser'
import levelup from 'levelup'
import leveldown from 'leveldown'
import os from 'os'
const level = (s: string) => levelup(leveldown(s))
const db: Map<string, ReturnType<typeof level>> = new Map()
// const app = new Router<DefaultState, Context>()
const app = express.Router()
app.use(bodyParser.json())
export default app
const dataDir = process.env.APPDATA || os.homedir()
const gamesDir = `${dataDir}/.seraphim/games`
const getDb = (s: string) => {
	if (!db.has(s)) db.set(s, level(`${gamesDir}/${s}/db`))
	return db.get(s)
}
app.post('/api/lst', async (req, res) => {
	const s = getDb(req.body.gameName).createKeyStream()
	res.send(await new Promise((res, rej) => {
		const lst: string[] = []
		s.on('data', d => lst.push(d.toString()))
		s.on('end', () => res(lst))
	}))
})
app.post('/api/read', async (req, res) => {
	res.send(await getDb(req.body.gameName).get(req.body.sectionName))
})
app.post('/api/write', async (req, res) => {
	// try {
	const db = getDb(req.body.gameName)
	await db.put(req.body.sectionName, req.body.content)
	// }
	// catch (e) {
	// 	ctx.throw(401)
	// }
	res.send('ok')
})
app.post('/api/del', async (req, res) => {
	const db = getDb(req.body.gameName)
	await db.del(req.body.sectionName)
	res.send('ok')
})
app.get('/res/:gameName/*', (req, res) => {
	// ctx.body = ctx.path
	res.sendFile(`${gamesDir}/${req.params.gameName}/res` + req.path.slice(req.params.gameName.length + 5))
})