// components.js — LIGHT MODE UI ONLY (keeps your logic and IDs)

window.chartState = window.chartState || { chartType: 'bar', dataType: 'block', loading: false };
let outputState = { output: '', isError: false };
let statusState = { isExecuting: false, hasOutput: false, hasError: false };
window.visualizationState = window.visualizationState || { chartData: null, loading: false, error: null, chartInstance: null };

window.reactSetOutput = (text) => { outputState.output = text; outputState.isError = false; statusState.hasOutput = !!text; renderOutputDisplay(); };
window.reactSetError = (flag) => { outputState.isError = !!flag; statusState.hasError = !!flag; renderOutputDisplay(); renderStatusIndicator(); };
window.reactSetExecuting = (flag) => { statusState.isExecuting = !!flag; renderStatusIndicator(); };

const chartTypes = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'doughnut', label: 'Doughnut Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'histogram', label: 'Histogram' },
  { value: 'boxplot', label: 'Box Plot' },
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'radar', label: 'Radar Chart' }
];

function getCSV(){ return window.Blockly?.CsvImportData?.data || []; }
function getCSVCols(){ const d=getCSV(); return d[0]?Object.keys(d[0]):[]; }

function renderChartControls() {
  const el = document.getElementById('react-controls-container');
  if (!el) return;
  const hasCSV = !!getCSV().length; const csv=getCSV(); const cols=getCSVCols();
  el.innerHTML = `
    <div class="flex items-center gap-3">
      ${hasCSV
        ? `<span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-ink border border-line text-xs">CSV loaded</span>
           <span class="text-xs text-mute">${csv.length} rows, ${cols.length} columns</span>`
        : `<span class="text-xs text-mute">Load a CSV with the block to enable charts</span>`}
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-2 py-1 rounded-md bg-surface2 text-mute border border-line text-xs">Type</span>
        <select id="chart-type-select" class="rounded-lg border border-line bg-white text-ink text-sm px-3 py-2 disabled:opacity-50">
          ${chartTypes.map(t => `<option value="${t.value}" ${window.chartState.chartType===t.value?'selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
    </div>`;
  const sel=document.getElementById('chart-type-select');
  if (sel) sel.addEventListener('change', e => { window.chartState.chartType = e.target.value; });
}
window.renderChartControls = renderChartControls;

function renderOutputDisplay() {
  const el = document.getElementById('output-root');
  if (!el) return;
  if (!outputState.output) { el.innerHTML=''; return; }
  el.innerHTML = `<div class="flex-1 mx-2">
    <pre class="${outputState.isError?'bg-red-50 text-red-700 border-red-200':'bg-surface2 text-ink border-line'} p-2 rounded-lg font-mono text-xs border max-h-16 overflow-auto">${outputState.output}</pre>
  </div>`;
}
window.renderOutputDisplay = renderOutputDisplay;

function renderStatusIndicator() {
  const el = document.getElementById('status-root'); if (!el) return;
  if (!statusState.isExecuting && !statusState.hasOutput) { el.innerHTML=''; return; }
  el.innerHTML = statusState.isExecuting ? (
    `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface2 text-mute border border-line text-xs">
      <div class="animate-spin h-3 w-3 border border-mute border-t-transparent rounded-full"></div> Executing…
    </span>`
  ) : (
    `<span class="${statusState.hasError?'bg-red-50 text-red-700 border-red-200':'bg-green-50 text-green-700 border-green-200'} inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs">
      ${statusState.hasError ? 'Error' : 'Ready'}
    </span>`
  );
}
window.renderStatusIndicator = renderStatusIndicator;

function toChartJsConfig(result){
  if(!result?.config) return null;
  return {
    type: result.chartType,
    data: result.config.data,
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color:'#111827' } }, title:{ display:!!result.config?.options?.plugins?.title?.text, color:'#111827' } },
      scales:{ x:{ ticks:{ color:'#374151' }, grid:{ color:'#e5e7eb' } }, y:{ ticks:{ color:'#374151' }, grid:{ color:'#e5e7eb' } } },
      ...result.config.options
    }
  };
}

function renderDataVisualization(){
  const host=document.getElementById('react-chart-container'); if(!host) return;
  if(window.visualizationState.error){
    host.innerHTML = `<div class="absolute top-3 left-3 right-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">Error: ${window.visualizationState.error}</div>`; return;
  }
  if(window.visualizationState.loading){
    host.innerHTML = `<div class="absolute inset-0 bg-white/60 grid place-items-center z-10">
      <div class="bg-surface border border-line rounded-lg p-3 flex items-center gap-2 shadow-soft">
        <div class="animate-spin h-5 w-5 border-2 border-brand border-t-transparent rounded-full"></div>
        <span class="text-ink">Generating chart…</span>
      </div></div>`; return;
  }
  if(!window.visualizationState.chartData){
    host.innerHTML = `<div class="grid place-items-center text-mute text-sm">Visualization will appear here when blocks are executed</div>`; return;
  }
  host.innerHTML = `<canvas id="chart-canvas" class="w-full h-full"></canvas>`;
  setTimeout(()=>{
    const canvas=document.getElementById('chart-canvas'); if(!canvas||!window.Chart) return;
    if(window.visualizationState.chartInstance) window.visualizationState.chartInstance.destroy();
    window.visualizationState.chartInstance = new Chart(canvas.getContext('2d'), toChartJsConfig(window.visualizationState.chartData));
  },0);
}
window.renderDataVisualization = renderDataVisualization;

function boot(){ renderChartControls(); renderOutputDisplay(); renderStatusIndicator(); renderDataVisualization(); }
document.addEventListener('DOMContentLoaded', boot);

window.addEventListener('csvDataChanged', () => {
  renderChartControls(); if(window.renderDataPanel) window.renderDataPanel();
});

/* Optional API surface your blocks may call */
window.AppApi = window.AppApi || {
  async processData({ data, operations }) {
    const res = await fetch('/api/process-data', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ data, operations })
    });
    return res.json();
  },
  
  async generateChart(data, chartType, options) {
    try {
      window.visualizationState.loading = true;
      if (window.renderDataVisualization) window.renderDataVisualization();
      
      const res = await fetch('/api/generate-chart', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ data, chartType, options })
      });
      
      const result = await res.json();
      
      if (result.success) {
        window.visualizationState.chartData = result;
        window.visualizationState.error = null;
      } else {
        window.visualizationState.error = result.error || 'Unknown error';
      }
    } catch (error) {
      window.visualizationState.error = error.message;
    } finally {
      window.visualizationState.loading = false;
      if (window.renderDataVisualization) window.renderDataVisualization();
    }
  }
};
