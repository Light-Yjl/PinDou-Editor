import fs from 'node:fs'
const modelSource = new URL('../bg-removal/', import.meta.url)
if (!fs.existsSync(modelSource)) throw new Error('请把源码解压到网页文件夹内的 source 子文件夹，确保 ../bg-removal 存在。')
fs.cpSync(modelSource, new URL('./public/bg-removal/', import.meta.url), { recursive: true })
for (const name of ['source.zip', 'THIRD-PARTY-NOTICES.txt']) {
  const from = new URL('../' + name, import.meta.url)
  if (fs.existsSync(from)) fs.copyFileSync(from, new URL('./public/' + name, import.meta.url))
}
fs.writeFileSync(new URL('./public/.nojekyll', import.meta.url), '')
