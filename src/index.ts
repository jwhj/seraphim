import VueCompositionApi, { defineComponent, computed } from '@vue/composition-api'
// import Vue from 'vue'
// import VueRouter from 'vue-router'
Vue.use(VueCompositionApi)
import game from './game'
import editor from './editor'
import saves from './saves'
import { $prompt } from './dialog-utils'
// @ts-ignore
import template from '../src/components/index.html'
const Index = defineComponent({
	template,
	setup(props, ctx) {
		const styles = computed<StylesType>(() => ({
			bar: {
				width: '40%',
				marginBottom: '10px'
			}
		}))
		const start = async () => {
			const gameName = await $prompt('Game name:')
			if (!gameName) return
			// @ts-ignore
			ctx.root.$router.push(`/game/${gameName}`)
		}
		return {
			styles,
			start
		}
	}
})
const router = new VueRouter({
	routes: [
		{
			path: '/', component: Index
		},
		{ path: '/game/:gameName', component: game },
		{ path: '/editor', component: editor },
		{ path: '/saves', component: saves }
	]
})
// @ts-ignore
new Vue(defineComponent({
	el: '#app',
	router,
	vuetify: new Vuetify()
}))