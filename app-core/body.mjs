export async function readBody(request, limit=32000) {
  if(Number(request.headers.get('content-length'))>limit) throw Object.assign(new Error('Request is too large.'),{status:413});
  if(!request.body)return '';
  const reader=request.body.getReader(),decoder=new TextDecoder();let size=0,result='';
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Object.assign(new Error('Request is too large.'),{status:413});}result+=decoder.decode(value,{stream:true});}
  return result+decoder.decode();
}
