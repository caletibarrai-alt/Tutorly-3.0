fetch('/api/auth/yo').then(r=>r.json()).then(r=>{
 if(r.data?.rol!=='ADMINISTRADOR'){location.replace('/');return}
 const script=document.createElement('script')
 script.src='app.js'
 document.head.append(script)
}).catch(()=>location.replace('/'))
