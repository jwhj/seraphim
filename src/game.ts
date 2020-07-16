import { defineComponent, reactive, ref, computed, watch, onUnmounted } from '@vue/composition-api'
import Typed from 'typed.js'
import Engine from './engine'
// @ts-ignore
import template from '../src/components/game.html'
// @ts-ignore
import backgroundImageTemplate from '../src/components/background-image.html'
const backgroundImage = defineComponent({
	template: backgroundImageTemplate,
	props: {
		src: String
	},
	setup(props, ctx) {
		const styles = computed<StylesType>(() => ({
			backgroundImageDiv: {
				position: 'fixed',
				left: 0,
				top: 0,
				width: '100%',
				height: '100%',
				backgroundPosition: 'center',
				backgroundSize: 'cover'
			}
		}))
		const prevImageStyle = reactive({ backgroundImage: '', ...styles.value.backgroundImageDiv })
		const curImageStyle = reactive({ backgroundImage: '', ...styles.value.backgroundImageDiv })
		const flag = ref(true)
		let pendingImage: string
		watch(() => props.src, value => {
			if (pendingImage) prevImageStyle.backgroundImage = pendingImage
			flag.value = false
			ctx.root.$nextTick(() => {
				pendingImage = curImageStyle.backgroundImage = `url(${value})`
				flag.value = true
				setTimeout(() => {
					prevImageStyle.backgroundImage = pendingImage
					pendingImage = undefined
				}, 1000)
			})
		})
		return {
			styles,
			prevImageStyle,
			curImageStyle,
			flag
		}
	}
})
import saves from './saves'
import { $prompt } from './dialog-utils'
import { assert } from 'console'
export default defineComponent({
	template,
	components: {
		'background-image': backgroundImage,
		'display-saves': saves
	},
	setup(props, ctx) {
		const styles = computed<StylesType>(() => ({
			frm: {
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'flex-end',
				justifyContent: 'center'
			},
			dialogContainer: {
				width: '80%',
				height: '35%',
				maxHeight: '13em',
				padding: '10px',
			},
			dialog: {
				width: '100%',
				height: '100%',
				padding: '7 20',
				opacity: 0.8,
				backgroundColor: state.char ? '#EEE' : '#CCC',
				transition: 'background-color 1s ease',
				userSelect: 'none'
			},
			char: {
				marginLeft: '-10px',
				color: '#999',
				width: '30%'
			},
			optsmodal: {
				position: 'fixed',
				left: 0,
				top: 0,
				width: '100%',
				height: '100%',
				backgroundColor: 'black',
				opacity: 0.7,
				zIndex: 5,
				padding: '10% 10%',
				color: 'white'
			}
		}))
		const state = reactive({
			text: '',
			char: undefined as string,
			backgroundImage: undefined as string,
			opts: undefined as string[],
			showSaves: false
		})
		let typed: Typed
		const finish = () => {
			state.text += engine.state.curText
			typed.destroy()
			typed = undefined
		}
		let ignoreAction = false
		const choose = (i: number) => {
			ignoreAction = false
			engine.ans[engine.state.qid] = [i, state.opts[i]]
			state.opts = engine.state.opts = undefined
			next()
		}
		const updateFromEngine = async () => {
			state.backgroundImage = `/res/${gameName}${engine.state.backgroundImage}`
			if (engine.state.qry) {
				ignoreAction = true
				const ans = await $prompt(engine.state.qry)
				engine.ans[engine.state.qid] = ans
				engine.state.qry = undefined
				ignoreAction = false
				next()
				return false
			} else if (engine.state.opts) {
				ignoreAction = true
				state.opts = engine.state.opts
				return false
			} else {
				state.char = engine.state.char
				state.text = engine.state.text
				typed = new Typed('.type', {
					strings: [engine.state.curText],
					typeSpeed: 20,
					onComplete: () => {
						finish()
					}
				})
			}
			return true
		}
		const next = async (): Promise<boolean> => {
			if (typed) {
				finish()
			} else if (!ignoreAction) {
				ignoreAction = true
				await engine.next()
				ignoreAction = false
				return await updateFromEngine()
			}
			return true
		}
		const fastForward = async (numberOfSteps?: number) => {
			numberOfSteps = numberOfSteps || Infinity
			for (let i = 0; i < numberOfSteps; i++)
				if (!await next()) break;
		}
		const loadFromSave = async (save: Engine) => {
			engine = save
			await updateFromEngine()
		}
		const onSelectSave = async (name: string) => {
			if (mode === 'save')
				localStorage.setItem(`save_${name}`, JSON.stringify(engine))
			else if (mode === 'load')
				await loadFromSave(Engine.from(JSON.parse(localStorage.getItem(`save_${name}`))))
			state.showSaves = false
		}
		const deleteSave = (name: string) => {
			localStorage.removeItem(`save_${name}`)
		}
		const handleKeydownEvent = (evt: KeyboardEvent) => {
			if (evt.key === ' ') next()
			if (evt.key === 's') {
				mode = 'save'
				state.showSaves = true
				ignoreAction = true
			}
			if (evt.key === 'l') {
				mode = 'load'
				state.showSaves = true
				ignoreAction = true
			}
		}
		// @ts-ignore
		const gameName: string = ctx.root.$route.params.gameName
		let engine = new Engine(gameName)
		engine.selectSection('start').then(() => next())
		let mode: string
		addEventListener('keydown', handleKeydownEvent)
		onUnmounted(() => removeEventListener('keydown', handleKeydownEvent))
		watch(() => state.showSaves, (value) => {
			if (!value) ignoreAction = false
		})
		// $prompt('blabla')
		return {
			styles,
			state,
			choose,
			next,
			fastForward,
			loadFromSave,
			onSelectSave,
			deleteSave
		}
	},
})