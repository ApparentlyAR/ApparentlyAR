// === CSV Import Block Definition ===
Blockly.defineBlocksWithJsonArray([
  {
    "type": "csv_import",
    "message0": "import CSV %1 %2",
    "args0": [
      {
        "type": "field_label",
        "name": "CSV_FILENAME",
        "text": "No file chosen"
      },
      {
        "type": "field_file_button",
        "name": "CSV_UPLOAD"
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
  }
  
  // Mark field as serializable to prevent warnings
  static get SERIALIZABLE() {
    return true;
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
              Blockly.CsvImportData.data = results.data;
              Blockly.CsvImportData.filename = file.name;
              
              // NEW: Display data in panel immediately and update column registry
              if (window.BlockUtils && window.BlockUtils.updateDataPanel) {
                window.BlockUtils.updateDataPanel(results.data);
              }
              
              this._dialogOpen = false;
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
}

Blockly.fieldRegistry.register('field_file_button', FieldFileButton);

Blockly.CsvImportData = {
  data: null,
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
    // Generate code to return the parsed CSV data  
    const code = 'Blockly.CsvImportData.data';
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