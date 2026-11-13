import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readBounded} from '../files.mjs';
import {run} from '../run.mjs';
test('production activation is disabled without explicit gate',async()=>{
  await assert.rejects(run({},[]),/disabled/);
});
test('bounded private input refuses symlinks, excess size and public permissions',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'rubato-file-test-'));
  try {
    const file=join(dir,'input');await writeFile(file,'fixture',{mode:0o600});
    assert.equal((await readBounded(file,100,true)).toString(),'fixture');
    await assert.rejects(readBounded(file,2,true));
    await symlink(file,join(dir,'link'));await assert.rejects(readBounded(join(dir,'link'),100,true));
    await chmod(file,0o644);await assert.rejects(readBounded(file,100,true));
  } finally { await rm(dir,{recursive:true,force:true}); }
});
