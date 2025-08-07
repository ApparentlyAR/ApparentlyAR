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
  }

  static fromJson(options) {
    return new FieldFileButton(options['value']);
  }

  showEditor_() {
    if (!this.fileInput_) {
      this.fileInput_ = document.createElement('input');
      this.fileInput_.type = 'file';
      this.fileInput_.accept = '.csv,text/csv';
      this.fileInput_.style.display = 'none';
      this.fileInput_.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.filename_ = file.name;
          // Update the filename field on the parent block
          if (this.sourceBlock_ && this.sourceBlock_.getField('CSV_FILENAME')) {
            this.sourceBlock_.getField('CSV_FILENAME').setValue(file.name);
          }
          // Re-render this field to hide the button
          this.render_();
          
          const reader = new FileReader();
          reader.onload = (event) => {
            Papa.parse(event.target.result, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                Blockly.CsvImportData.data = results.data;
                Blockly.CsvImportData.filename = file.name;
              }
            });
          };
          reader.readAsText(file);
        }
      });
    }
    this.fileInput_.value = '';
    this.fileInput_.click();
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
      html.querySelector('button').onclick = (e) => {
        e.preventDefault();
        this.showEditor_();
      };
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

Blockly.Extensions.register('csv_import_extension', function() {
  // Handler for Choose File button
  this.getField('CSV_UPLOAD').setValidator(() => {
    let fileInput = document.getElementById('csv-upload-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv,text/csv';
      fileInput.style.display = 'none';
      fileInput.id = 'csv-upload-input';
      document.body.appendChild(fileInput);
    }
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        Blockly.CsvImportData.filename = file.name;
        this.getSourceBlock().setFieldValue(file.name, 'CSV_FILENAME');
        const reader = new FileReader();
        reader.onload = (event) => {
          const csv = event.target.result;
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
              Blockly.CsvImportData.data = results.data;
            }
          });
        };
        reader.readAsText(file);
      }
    };
    fileInput.value = '';
    fileInput.click();
    return null;
  });
  // Handler for + button (can be used for future features, e.g., multiple datasets)
  this.getField('CSV_PLUS').setValidator(() => {
    alert('Add more datasets feature coming soon!');
    return null;
  });
});

Blockly.Extensions.apply('csv_import_extension', Blockly.Blocks['csv_import'], true); 