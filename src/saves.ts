import { defineComponent, reactive, ref, computed } from '@vue/composition-api'
import uuid from 'uuid/v4'
// @ts-ignore
import template from '../src/components/saves.html'
export const loadSavesList = (): string[] => {
	return JSON.parse(localStorage.getItem('savesList')) || []
}
export default defineComponent({
	template,
	setup(props, ctx) {
		const styles = computed<StylesType>(() => ({
			savesList: {
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				alignItems: 'center'
			},
			save: {
				width: '90%',
				// height: '12em',
				// margin: '10px'
			}
		}))
		const savesListRef = ref(loadSavesList())
		const add = () => {
			const s = uuid()
			savesListRef.value.push(s)
			localStorage.setItem('savesList', JSON.stringify(savesListRef.value))
		}
		const del = (name: string) => {
			const lst = savesListRef.value
			const i = lst.indexOf(name)
			if (i !== -1) {
				for (let j = i; j < lst.length; j++) lst[j] = lst[j + 1]
				lst.pop()
			}
			savesListRef.value = lst
			localStorage.setItem('savesList', JSON.stringify(savesListRef.value))
			ctx.emit('del', name)
		}
		const select = (name: string) => {
			// console.log(name)
			ctx.emit('select', name)
		}
		return {
			styles,
			savesListRef,
			add,
			del,
			select
		}
	}
})