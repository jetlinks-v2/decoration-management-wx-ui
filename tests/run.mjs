import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
const tests=readdirSync('tests').filter(name=>name.endsWith('.test.mjs'))
const result=spawnSync(process.execPath,['--test',...tests.map(name=>'tests/'+name)],{stdio:'inherit'})
process.exitCode=result.status??1
