import { defineComponent, reactive, ref, watch } from '@vue/composition-api'
// @ts-ignore
import vPromptTemplate from '../src/components/v-prompt.html'
const promptState = reactive({
	label: '',
	show: false,
	text: ''
})
let resolveText: (text: string) => void
const vPrompt = defineComponent({
	template: vPromptTemplate,
	props: {
		confirmLabel: String,
		cancelLabel: String
	},
	setup(props) {
		const state = promptState
		const confirm = () => {
			resolveText(promptState.text)
		}
		const cancel = () => {
			resolveText(undefined)
		}
		return {
			props,
			state,
			confirm,
			cancel
		}
	}
})
Vue.component('v-prompt', vPrompt)
export const $prompt = async (label: string): Promise<string> => {
	promptState.label = label
	promptState.show = true
	promptState.text = ''
	const text = await new Promise((res: (value: string) => void) => {
		resolveText = res
	})
	promptState.show = false
	return text
}
// @ts-ignore
import vConfirmTemplate from '../src/components/v-confirm.html'
const confirmState = reactive({
	label: '',
	show: false,
	defaultFocus: ''
})
let resolveConfirm: (value: boolean) => void
type VueButtonType = {
	$el: HTMLButtonElement
}
const vConfirm = defineComponent({
	template: vConfirmTemplate,
	props: {
		confirmLabel: String,
		cancelLabel: String
	},
	setup(props, ctx) {
		const state = confirmState
		const confirmRef = ref<VueButtonType>()
		const cancelRef = ref<VueButtonType>()
		const confirm = () => {
			resolveConfirm(true)
		}
		const cancel = () => {
			resolveConfirm(false)
		}
		watch(() => state.show, value => {
			if (value) {
				ctx.root.$nextTick(() => {
					if (state.defaultFocus === 'confirm')
						confirmRef.value.$el.focus()
					else if (state.defaultFocus === 'cancel')
						cancelRef.value.$el.focus()
				})
			}
		})
		return {
			props,
			state,
			confirmRef, cancelRef,
			confirm,
			cancel
		}
	}
})
Vue.component('v-confirm', vConfirm)
export const $confirm = async (label: string, defaultFocus = 'confirm') => {
	confirmState.label = label
	confirmState.show = true
	confirmState.defaultFocus = defaultFocus
	const value = await new Promise((res: (value: boolean) => void) => {
		resolveConfirm = res
	})
	confirmState.show = false
	return value
}