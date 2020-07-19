import { defineComponent, reactive, computed, ref, watch } from '@vue/composition-api'
import uuid from 'uuid/v4'
// @ts-ignore
import template from '../src/components/background-image.html'
export default defineComponent({
	template,
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
		const imageList = reactive<[string, string, boolean][]>([])
		watch(() => props.src, value => {
			const img: [string, string, boolean] = [`url(${value})`, uuid(), false]
			imageList.push(img)
			if (imageList.length > 10) imageList.splice(0, 5)
			ctx.root.$nextTick(() => {
				imageList.pop()
				img[2] = true
				imageList.push(img)
				// console.log(imageURLList)
			})
		})
		return {
			styles,
			imageList
		}
	}
})