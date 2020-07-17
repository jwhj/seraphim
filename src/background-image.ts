import { defineComponent, reactive, computed, ref, watch } from '@vue/composition-api'
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
		const imageList = reactive<(string | boolean)[][]>([])
		watch(() => props.src, value => {
			const img = [`url(${value})`, false]
			imageList.push(img)
			if (imageList.length > 10) imageList.splice(0, 5)
			ctx.root.$nextTick(() => {
				imageList.pop()
				img[1] = true
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