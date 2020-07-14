const { spawn } = require('child_process')
const startService = (cmd, argv, opts) => {
	const a = spawn(cmd, argv, opts)
	a.stdout.pipe(process.stdout)
	a.stderr.pipe(process.stderr)
}
startService('tsc.cmd', ['-w', '-p', '.'])
// startService('tsc.cmd', ['-w', '-p', './server'])
startService('rollup.cmd', ['-w', '-c', '-m'])