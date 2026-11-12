import {build} from 'esbuild'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
const require=createRequire(import.meta.url)
const result=await build({entryPoints:[fileURLToPath(new URL('./shell-runtime.test.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['vue']})
const loaded={exports:{}}
new Function('require','module','exports',result.outputFiles[0].text)(require,loaded,loaded.exports)
