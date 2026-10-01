const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}}; new Function('exports','require','module',code)(mod.exports,require,mod); return mod.exports;
}
const {History}=load('src/lib/history.ts');
const {paintCell}=load('src/lib/paintCell.ts');
const {floodFill}=load('src/lib/floodFill.ts');
const red={id:'red',hex:'#ff0000',code:'R',name:'red'};
const blue={id:'blue',hex:'#0000ff',code:'B',name:'blue'};
const original={width:3,height:1,cells:[[0,1,2].map(x=>({x,y:0,color:red}))],colorCounts:new Map([['red',{color:red,count:3}]]),totalBeads:3};
const h=new History(original);
h.start(); h.set(p=>paintCell(p,0,0,blue)); h.set(p=>paintCell(p,1,0,blue)); h.end();
assert.equal(h.entries.length,2); assert.equal(h.value.colorCounts.get('blue').count,2);
h.undo(); assert.equal(h.value,original); assert.equal(original.colorCounts.get('red').count,3);
h.redo(); assert.equal(h.value.cells[0][1].color.id,'blue');
const before=h.value; h.set(p=>paintCell(p,0,0,blue)); assert.equal(h.value,before);
h.set(p=>paintCell(p,0,0,null)); assert.equal(h.value.totalBeads,2); h.undo(); assert.equal(h.value.totalBeads,3);
const filled=floodFill(original,0,0,red,blue); assert.equal(filled.colorCounts.get('blue').count,3); assert.equal(original.colorCounts.get('red').count,3);
h.undo(); h.set(p=>paintCell(p,2,0,null)); assert.equal(h.index,h.entries.length-1);
const map=JSON.parse(fs.readFileSync('public/bg-removal/resources.json'));
let total=0;
for(const [key,entry] of Object.entries(map)) {
  let offset=0;
  for(const chunk of entry.chunks) {
    const data=fs.readFileSync(path.join('public/bg-removal',chunk.name));
    assert.equal(chunk.offsets[0],offset); assert.equal(data.length,chunk.offsets[1]-chunk.offsets[0]);
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),chunk.hash);
    offset+=data.length;
  }
  assert.equal(offset,entry.size,key); total+=entry.size;
}
console.log('PASS: continuous paint, eraser, grouped undo/redo, fill, immutable color counts, and all AI chunk hashes ('+total+' bytes).');
