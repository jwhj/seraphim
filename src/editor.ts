import { defineComponent, reactive, ref, computed } from '@vue/composition-api'
import postData from './post-data'
import uuid from 'uuid/v4'
// @ts-ignore
import template from '../src/components/editor.html'
import { $prompt } from './dialog-utils'
export default defineComponent({
	template,
	setup(props, ctx) {
		const styles = computed<StylesType>(() => ({
			frm: {
				display: 'flex',
				padding: '10px',
				height: '100%',
			},
			sectionList: {
				width: '20%'
			}
		}))
		const state = reactive({
			gameName: undefined as string,
			sectionName: undefined as string,
			content: undefined as string
		})
		const editorRef = ref<HTMLTextAreaElement>()
		const sectionListRef = ref([])
		const loadSectionList = async (gameName: string) => {
			sectionListRef.value = await postData.json('/api/lst', {
				gameName
			})
		}
		const newSection = async () => {
			const sectionName = (await $prompt('Section name:')) || uuid()
			await postData('/api/write', {
				gameName: state.gameName,
				sectionName,
				content: ''
			})
			await loadSectionList(state.gameName)
			await loadSection(sectionName)
		}
		const deleteSection = async (sectionName: string) => {
			// if (!await $confirm(`Are you sure you want to delete "${sectionName}"?`)) return
			// @ts-ignore
			ctx.root.$confirm({
				title: `Are you sure you want to delete "${sectionName}"?`,
				content: `The section "${sectionName}" will be permanently deleted.`,
				onOk: async () => {
					await postData('/api/del', {
						gameName: state.gameName,
						sectionName
					})
					await loadSectionList(state.gameName)
					state.sectionName = undefined
				}
			})
		}
		const loadSection = async (name: string) => {
			state.sectionName = name
			state.content = await postData.text('/api/read', {
				gameName: state.gameName,
				sectionName: name
			})
			editorRef.value.focus()
		}
		const updateSection = async () => {
			await postData('/api/write', {
				gameName: state.gameName,
				sectionName: state.sectionName,
				content: state.content
			})
		}
		return {
			styles,
			state,
			sectionListRef,
			editorRef,
			loadSectionList,
			newSection,
			deleteSection,
			loadSection,
			updateSection
		}
	}
})