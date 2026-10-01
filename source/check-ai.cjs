const fs=require('node:fs');
const ort=require('onnxruntime-web');
(async()=>{
  ort.env.wasm.numThreads=1;
  const resources=JSON.parse(fs.readFileSync('public/bg-removal/resources.json'));
  const bytes=Buffer.concat(resources['/models/isnet_quint8'].chunks.map(c=>fs.readFileSync('public/bg-removal/'+c.name)));
  const session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});
  const input=new ort.Tensor('float32',new Float32Array(3*1024*1024),[1,3,1024,1024]);
  const output=await session.run({[session.inputNames[0]]:input});
  console.log('PASS: quantized AI model executed using single-thread WASM.',Object.fromEntries(Object.entries(output).map(([k,v])=>[k,v.dims])));
  await session.release();
})().catch(error=>{console.error(error);process.exitCode=1});
