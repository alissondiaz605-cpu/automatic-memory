// App logic with role-based view, employee name tracking
const $ = id => document.getElementById(id);
let gastos = JSON.parse(localStorage.getItem('gastos')||'[]');
let reportes = JSON.parse(localStorage.getItem('reportes')||'[]');

function format(n){return Number(n||0).toFixed(2);}

function renderGastos(){
  const lista = $('listaGastos');
  lista.innerHTML = '';
  gastos.forEach((g, i)=>{
    const div = document.createElement('div');
    div.className='line';
    div.innerHTML = `<div><strong>${g.tipo==='sueldos'?'[S] ':'[G] '}</strong> ${g.desc}</div><div>$ ${format(g.valor)}</div>`;
    lista.appendChild(div);
  });
  const total = gastos.reduce((s,g)=>s+Number(g.valor),0);
  const totalSueldos = gastos.filter(g=>g.tipo==='sueldos').reduce((s,g)=>s+Number(g.valor),0);
  $('totalGastos').textContent = format(total);
  $('totalSueldos').textContent = format(totalSueldos);
}

function renderReportes(){
  const cont = $('reportesGuardados');
  cont.innerHTML='';
  reportes.slice().reverse().forEach((r,idx)=>{
    const d = document.createElement('div');
    d.className='line';
    d.innerHTML = `<div>${r.fecha} - ${r.usuario||'Sin nombre'}</div><div><button data-i="${reportes.length-1-idx}" class="cargar">Cargar</button> <button data-i="${reportes.length-1-idx}" class="borrar">Borrar</button></div>`;
    cont.appendChild(d);
  });
  cont.querySelectorAll('.cargar').forEach(b=>b.addEventListener('click',e=>{
    const i = e.target.dataset.i; const r = reportes[i];
    $('efectivo').value = r.efectivo; $('transferencias').value = r.transferencias;
    gastos = r.gastos; $('employeeName').value = r.usuario || '';
    saveDraft(); renderGastos();
  }));
  cont.querySelectorAll('.borrar').forEach(b=>b.addEventListener('click',e=>{
    const i = e.target.dataset.i; reportes.splice(i,1); localStorage.setItem('reportes',JSON.stringify(reportes)); renderReportes();
  }));
}

function ventaTotal(){
  const e = Number($('efectivo').value||0);
  const t = Number($('transferencias').value||0);
  return e + t;
}

function saveDraft(){
  localStorage.setItem('gastos', JSON.stringify(gastos));
  localStorage.setItem('draft_efectivo', $('efectivo').value);
  localStorage.setItem('draft_transferencias', $('transferencias').value);
  localStorage.setItem('draft_usuario', $('employeeName').value);
}

function agregarGasto(){
  const desc = $('gastoDesc').value.trim();
  const val = Number($('gastoValor').value);
  const tipo = document.querySelector('input[name="tipoGasto"]:checked').value;
  if(!desc || !val) return alert('Ingrese descripción y valor');
  gastos.push({desc, valor: val, tipo});
  $('gastoDesc').value=''; $('gastoValor').value='';
  saveDraft(); renderGastos();
}

function guardarReporte(){
  const usuario = $('employeeName').value.trim() || 'Sin nombre';
  const r = {
    fecha: new Date().toLocaleString(),
    efectivo: $('efectivo').value || '0',
    transferencias: $('transferencias').value || '0',
    gastos,
    usuario
  };
  reportes.push(r);
  localStorage.setItem('reportes', JSON.stringify(reportes));
  // clear current draft but keep saved copy
  gastos = [];
  $('efectivo').value=''; $('transferencias').value=''; $('employeeName').value='';
  localStorage.removeItem('gastos');
  localStorage.removeItem('draft_efectivo');
  localStorage.removeItem('draft_transferencias');
  localStorage.removeItem('draft_usuario');
  renderGastos(); renderReportes();
  alert('Reporte guardado localmente.');
}

function generarCSV(currentOnly=true){
  const ef = $('efectivo').value || '0';
  const tr = $('transferencias').value || '0';
  const vt = ventaTotal();
  const usuario = $('employeeName').value || '';
  const h = ['fecha','usuario','efectivo','transferencias','venta_total','gasto_desc','gasto_valor','gasto_tipo'];
  const rows = [];
  const fecha = new Date().toISOString();
  if(currentOnly){
    if(gastos.length===0){
      rows.push([fecha,usuario,ef,tr,vt,'',0,'']);
    } else {
      gastos.forEach(g=>{
        rows.push([fecha,usuario,ef,tr,vt,g.desc,g.valor,g.tipo]);
      });
    }
  } else {
    // export all saved reports
    reportes.forEach(r=>{
      const vt2 = Number(r.efectivo||0)+Number(r.transferencias||0);
      if(r.gastos.length===0) rows.push([r.fecha,r.usuario,r.efectivo,r.transferencias,vt2,'',0,'']);
      else r.gastos.forEach(g=>rows.push([r.fecha,r.usuario,r.efectivo,r.transferencias,vt2,g.desc,g.valor,g.tipo]));
    });
  }
  const csv = [h.join(',')].concat(rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(','))).join('\n');
  return csv;
}

function descargarCSV(){
  const csv = generarCSV(true);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_doncafe_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function copiarCSV(){
  const csv = generarCSV(true);
  navigator.clipboard.writeText(csv).then(()=>alert('CSV copiado al portapapeles.'), ()=>alert('No se pudo copiar. Usa Exportar CSV.'));
}

function limpiar(){
  if(confirm('Limpiar todos los datos guardados localmente?')){
    localStorage.clear(); gastos=[]; reportes=[]; $('efectivo').value=''; $('transferencias').value=''; $('employeeName').value=''; renderGastos(); renderReportes(); toggleRoleView();
  }
}

// role handling
function toggleRoleView(){
  const role = $('roleSelect').value;
  const ownerControls = $('ownerControls');
  if(role === 'employee'){
    ownerControls.style.display = 'none';
  } else {
    ownerControls.style.display = 'block';
  }
  // save role
  localStorage.setItem('user_role', role);
}

$('agregarGasto').addEventListener('click', agregarGasto);
$('guardarReporte').addEventListener('click', guardarReporte);
$('exportCSV').addEventListener('click', descargarCSV);
$('copiarCSV').addEventListener('click', copiarCSV);
$('limpiar').addEventListener('click', limpiar);
$('roleSelect').addEventListener('change', ()=>{ toggleRoleView(); });

// init
window.addEventListener('load', ()=>{
  // restore draft
  gastos = JSON.parse(localStorage.getItem('gastos')||'[]');
  $('efectivo').value = localStorage.getItem('draft_efectivo') || '';
  $('transferencias').value = localStorage.getItem('draft_transferencias') || '';
  $('employeeName').value = localStorage.getItem('draft_usuario') || '';
  reportes = JSON.parse(localStorage.getItem('reportes')||'[]');
  const storedRole = localStorage.getItem('user_role') || 'owner';
  $('roleSelect').value = storedRole;
  renderGastos(); renderReportes();
  toggleRoleView();

  // venta total reactive
  $('efectivo').addEventListener('input', ()=>{$('ventaTotal').textContent = format(ventaTotal()); saveDraft();});
  $('transferencias').addEventListener('input', ()=>{$('ventaTotal').textContent = format(ventaTotal()); saveDraft();});
  $('ventaTotal').textContent = format(ventaTotal());
});

// register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>console.log('sw failed'));
}
