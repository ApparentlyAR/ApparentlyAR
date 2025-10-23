/**
 * CSV Import Blockly block and generator
 *
 * - Provides a custom field button to upload a CSV and parse it via PapaParse.
 * - Stores parsed rows on Blockly.CsvImportData.data for later blocks.
 * - Registers the generator using both legacy (obj['csv_import']) and
 *   the newer forBlock API for maximum compatibility.
 */
// === CSV Import Block Definition ===
Blockly.defineBlocksWithJsonArray([
  {
    "type": "csv_import",
    "message0": "import CSV %1 %2",
    "args0": [
      {
        "type": "field_label",
        "name": "CSV_FILENAME",
        "text": "No file chosen",
        "SERIALIZABLE": true
      },
      {
        "type": "field_file_button",
        "name": "CSV_UPLOAD",
        "SERIALIZABLE": true
      }
    ],
    "output": "Dataset",
    "colour": 230,
    "tooltip": "Import a CSV file as a dataset.",
    "helpUrl": ""
  }
]);

// Custom Blockly field for file upload
class FieldFileButton extends Blockly.Field {
  constructor(value, validator) {
    super(value, validator);
    this.button_ = null;
    this.fileInput_ = null;
    this.filename_ = 'No file chosen';
    this._dialogOpen = false;
    this.SERIALIZABLE = true;
  }

  static fromJson(options) {
    return new FieldFileButton(options['value']);
  }

  showEditor_() {
    if (this._dialogOpen) {
      return;
    }
    this._dialogOpen = true;
    // Always create a fresh input per open to avoid stale listeners
    this.fileInput_ = document.createElement('input');
    this.fileInput_.type = 'file';
    this.fileInput_.accept = '.csv,text/csv';
    this.fileInput_.style.display = 'none';
    this.fileInput_.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.filename_ = file.name;
        if (this.sourceBlock_ && this.sourceBlock_.getField('CSV_FILENAME')) {
          this.sourceBlock_.getField('CSV_FILENAME').setValue(file.name);
        }
        this.render_();
        const reader = new FileReader();
        reader.onload = (event) => {
          Papa.parse(event.target.result, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              // Store both original and current data to prevent filter chaining issues
              Blockly.CsvImportData.data = results.data;
              Blockly.CsvImportData.originalData = [...results.data]; // Keep original data immutable
              Blockly.CsvImportData.filename = file.name;
              this._dialogOpen = false;
              
              console.log('[CSV Import] Data loaded, triggering autofill for all systems...');

              // Persist the uploaded CSV to server immediately so it appears in /uploads for all users
              (async () => {
                try {
                  if (typeof window !== 'undefined') {
                    const saver = window.BlocklyPersistCsv || (window.AppApi && window.AppApi.saveCsv);
                    if (saver) {
                      let res;
                      if (window.BlocklyPersistCsv) {
                        res = await window.BlocklyPersistCsv(results.data);
                      } else {
                        res = await window.AppApi.saveCsv(results.data, file.name, true);
                      }
                      if (res && res.success && res.path && window.Blockly && window.Blockly.CsvImportData) {
                        window.Blockly.CsvImportData.savedPath = res.path;
                        console.log('[CSV Import] CSV persisted to', res.path);
                      }
                    }
                  }
                } catch (persistErr) {
                  console.warn('[CSV Import] Persist to server failed (non-fatal):', persistErr);
                }
              })();

              // Notify the application that CSV data has changed so UI elements can update
              if (typeof window !== 'undefined') {
                try {
                  window.dispatchEvent(new CustomEvent('csvDataChanged', {
                    detail: {
                      filename: file.name,
                      rows: Array.isArray(results.data) ? results.data.length : 0,
                      columns: Array.isArray(results.data) && results.data[0] ? Object.keys(results.data[0]).length : 0
                    }
                  }));
                } catch (eventError) {
                  console.warn('[CSV Import] Failed to dispatch csvDataChanged event:', eventError);
                }
              }
              
              // Trigger autofill for all existing blocks when CSV data is loaded
              if (window.BlocklyAutofill && window.BlocklyAutofill.updateAllBlocksWithAutofill) {
                console.log('[CSV Import] Triggering data blocks autofill');
                setTimeout(() => {
                  window.BlocklyAutofill.updateAllBlocksWithAutofill();
                }, 100); // Small delay to ensure blocks are rendered
              } else {
                console.warn('[CSV Import] BlocklyAutofill not available');
              }
              
              // Also trigger autofill for statistics blocks
              if (window.BlocklyStatisticsAutofill && window.BlocklyStatisticsAutofill.updateAllStatisticsBlocksWithAutofill) {
                console.log('[CSV Import] Triggering statistics blocks autofill');
                setTimeout(() => {
                  window.BlocklyStatisticsAutofill.updateAllStatisticsBlocksWithAutofill();
                }, 150); // Slightly longer delay for statistics blocks
              } else {
                console.warn('[CSV Import] BlocklyStatisticsAutofill not available');
              }
              
              // Also trigger autofill for visualization blocks
              if (window.BlocklyVisualizationAutofill && window.BlocklyVisualizationAutofill.updateAllVisualizationBlocksWithAutofill) {
                console.log('[CSV Import] Triggering visualization blocks autofill');
                setTimeout(() => {
                  window.BlocklyVisualizationAutofill.updateAllVisualizationBlocksWithAutofill();
                }, 200); // Slightly longer delay for visualization blocks
              } else {
                console.warn('[CSV Import] BlocklyVisualizationAutofill not available');
              }

              // Also trigger autofill for transformation blocks
              if (window.BlocklyTransformAutofill && window.BlocklyTransformAutofill.updateAllTransformationBlocksWithAutofill) {
                console.log('[CSV Import] Triggering transformation blocks autofill');
                setTimeout(() => {
                  window.BlocklyTransformAutofill.updateAllTransformationBlocksWithAutofill();
                }, 220); // Ensure runs after other systems
              } else {
                console.warn('[CSV Import] BlocklyTransformAutofill not available');
              }
            }
          });
        };
        reader.readAsText(file);
      } else {
        this._dialogOpen = false;
      }
    }, { once: true });
    this.fileInput_.value = '';
    this.fileInput_.click();
    // Safety reset in case 'change' doesn't fire (cancel)
    setTimeout(() => { this._dialogOpen = false; }, 800);
  }

  // Render only the plus button
  render_() {
    super.render_();
    if (this.button_) {
      this.button_.remove();
    }
    
    // Don't render the button if a file has been uploaded
    if (this.filename_ !== 'No file chosen') {
      return;
    }
    
    const group = this.getSvgRoot();
    if (group) {
      this.button_ = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      this.button_.setAttribute('width', 24);
      this.button_.setAttribute('height', 24);
      this.button_.setAttribute('x', 0);
      this.button_.setAttribute('y', 0);
      const html = document.createElement('div');
      html.style.width = '24px';
      html.style.height = '24px';
      html.innerHTML = `<button style="height:24px;width:24px;border-radius:50%;border:none;background:#2d8cf0;color:white;font-size:16px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>`;
      const btn = html.querySelector('button');
      const stopAll = (e) => {
        e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      };
      btn.addEventListener('mousedown', stopAll);
      btn.addEventListener('touchstart', stopAll, { passive: false });
      btn.addEventListener('click', (e) => {
        // We open the editor ourselves and stop further handling to avoid duplicates
        stopAll(e);
        this.showEditor_();
      });
      this.button_.appendChild(html);
      group.appendChild(this.button_);
    }
  }

  getDisplayText_() {
    return ''; // Return empty string to prevent default text rendering
  }

  // Serialization methods
  saveState() {
    return {
      filename: this.filename_
    };
  }

  loadState(state) {
    this.filename_ = state.filename || 'No file chosen';
    this.render_();
  }
}

Blockly.fieldRegistry.register('field_file_button', FieldFileButton);

Blockly.CsvImportData = {
  data: null,
  originalData: null,
  filename: null
};

// Register a no-op extension for compatibility with tests and future hooks
if (typeof Blockly !== 'undefined' && Blockly.Extensions && typeof Blockly.Extensions.register === 'function') {
  Blockly.Extensions.register('csv_import_extension', function() {
    // Intentionally left blank; FieldFileButton handles interaction.
  });
}

// JavaScript generator for the csv_import block using multiple registration methods
function registerCsvImportGenerator() {
  const generator = function() {
    console.log('CSV import JavaScript generator called');
    console.log('Current CSV data at generation time:', Blockly.CsvImportData.data ? 'has data' : 'null/undefined');
    // Always start pipelines from the original, unmodified dataset when using the csv_import block.
    // This prevents previous runs (that mutated CsvImportData.data) from narrowing subsequent filters.
    const code = '(window.Blockly && window.Blockly.CsvImportData ? (window.Blockly.CsvImportData.originalData || window.Blockly.CsvImportData.data) : null)';
    console.log('Generated code:', code);
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
    // Method 1: Robust assignment (non-writable to avoid accidental clobbering)
    try {
      Object.defineProperty(Blockly.JavaScript, 'csv_import', { value: generator, configurable: true });
    } catch (_) {
      Blockly.JavaScript['csv_import'] = generator;
    }
    
    // Method 2: Using forBlock (if available)
    if (Blockly.JavaScript.forBlock) {
      try {
        Object.defineProperty(Blockly.JavaScript.forBlock, 'csv_import', { value: generator, configurable: true });
      } catch (_) {
        Blockly.JavaScript.forBlock['csv_import'] = generator;
      }
    }
    
    // Also mirror onto window.Blockly if present (test/browser parity)
    if (typeof window !== 'undefined' && window.Blockly && window.Blockly.JavaScript) {
      try {
        Object.defineProperty(window.Blockly.JavaScript, 'csv_import', { value: generator, configurable: true });
      } catch (_) {
        window.Blockly.JavaScript['csv_import'] = generator;
      }
    }
    
    console.log('CSV import JavaScript generator registered successfully');
    
    // Verify registration immediately
    console.log('Immediate verification - csv_import generator exists:', !!Blockly.JavaScript['csv_import']);
    
    // Also register on the prototype if it exists
    if (Blockly.JavaScript.prototype) {
      Blockly.JavaScript.prototype['csv_import'] = generator;
    }
    
  } else {
    console.error('Blockly.JavaScript not available when trying to register csv_import generator');
  }
}

// Register immediately and avoid re-registration timers (prevents jest flakiness)
registerCsvImportGenerator(); 
