import postData from "../post-data"
class State {
	text = ''
	curText = ''
	char: string
	qid: string
	qry: string
	opts: string[]
	_backgroundImage: string
	backgroundImageChanged = false
	get backgroundImage(): string {
		return this._backgroundImage || '/transparent.png'
	}
	set backgroundImage(s: string) {
		this._backgroundImage = s
		this.backgroundImageChanged = true
	}
	applyText(s: string) {
		this.text += this.curText
		this.curText = s
	}
}
const opsType: { [key: string]: number } = {}
const ops: { [key: string]: (engine: Engine, argv: string[]) => Promise<boolean> } = {}
ops['\\char'] = async (engine, argv): Promise<boolean> => {
	if (argv.length > 1) engine.state.char = argv[1]
	else engine.state.char = undefined
	await ops['\\clear'](engine, [])
	return false
}
ops['\\background-image'] = async (engine, argv): Promise<boolean> => {
	engine.state.backgroundImage = argv[1]
	return false
}
ops['\\newline'] = async (engine, argv): Promise<boolean> => {
	engine.state.curText += '<br/>'
	return false
}
ops['\\clear'] = async (engine, argv): Promise<boolean> => {
	engine.state.text = engine.state.curText = ''
	return Boolean(argv[1])
}
opsType['\\text'] = 1
ops['\\text'] = async (engine, argv): Promise<boolean> => {
	engine.state.applyText(argv[1])
	return true
}
ops['\\goto'] = async (engine, argv): Promise<boolean> => {
	await engine.selectSection(argv[1])
	return false
}
ops['\\query'] = async (engine, argv): Promise<boolean> => {
	engine.state.qid = argv[1]
	engine.state.qry = await engine.loadSection(argv[1])
	return true
}
ops['\\options'] = async (engine, argv): Promise<boolean> => {
	engine.state.qid = argv[1]
	engine.state.opts = (await engine.loadSection(argv[1])).split('\n')
	return true
}
opsType['\\script'] = 1
ops['\\script'] = async (engine, argv): Promise<boolean> => {
	void (new Function(argv[1])).call(engine)
	return false
}
ops['\\beginscript'] = async (engine, argv): Promise<boolean> => {
	const code = []
	let line: string
	while ((line = engine.nextLine()) !== '\\endscript') code.push(line)
	void (new Function(code.join('\n'))).call(engine)
	return false
}
export default class Engine {
	gameName: string
	cnt = 0
	cnt1 = 0
	lst: string[] = []
	lst1: string[] = []
	ans: { [key: string]: any } = {}
	data = {}
	state: State
	constructor(gameName: string) {
		this.gameName = gameName
		this.state = new State()
	}
	static from(obj: { state: object }): Engine {
		// -------------------------------- CAUTION --------------------------------
		// This implementation should be further considered.
		Object.setPrototypeOf(obj, Engine.prototype)
		if (!obj.hasOwnProperty('state')) obj.state = new State()
		else Object.setPrototypeOf(obj.state, State.prototype)
		return obj as Engine
	}
	async loadSection(sectionName: string): Promise<string> {
		// return (await axios.post('/api/read', {
		// 	gameName: this.gameName,
		// 	sectionName
		// })).data
		return await postData.text('/api/read', {
			gameName: this.gameName,
			sectionName
		})
	}
	async selectSection(sectionName: string) {
		this.lst = (await this.loadSection(sectionName)).split('\n')
		this.lst1 = []
		this.cnt = this.cnt1 = 0
	}
	addLine(s: string) {
		this.lst1.push(s)
	}
	nextLine(): string {
		if (this.cnt1 < this.lst1.length) return this.lst1[this.cnt1++]
		if (this.cnt < this.lst.length) return this.lst[this.cnt++]
		throw 'No more lines.'
	}
	async next() {
		let flag = false
		while (!flag) {
			const line = this.nextLine()
			if (!line.startsWith('\\')) {
				if (line === '') flag = await ops['\\newline'](this, [])
				else {
					this.state.applyText(line)
					break
				}
			}
			else {
				let lst = line.split(' ')
				if (lst[0] in ops) {
					if (lst[0] in opsType) {
						const cnt = opsType[lst[0]]
						lst = [...lst.slice(0, cnt), lst.slice(cnt).join(' ')]
					}
					flag = await ops[lst[0]](this, lst.filter(Boolean))
				}
				else throw `Unexpected token ${lst[0]}`
			}
		}
	}
}