import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { string as str } from 'rollup-plugin-string'
import sourcemap from 'rollup-plugin-sourcemaps'
export default {
	input: 'dist/index.js',
	output: {
		file: 'public/bundle.js',
		format: 'umd',
		sourcemap: true,
		globals: {
			'@vue/composition-api': 'vueCompositionApi',
			'typed.js': 'Typed',
			'axios': 'axios'
		}
	},
	external: ['@vue/composition-api', 'typed.js', 'axios'],
	plugins: [
		resolve({
			browser: true
		}),
		commonjs(),
		str({
			include: 'src/components/*.html'
		}),
		sourcemap()
	]
}