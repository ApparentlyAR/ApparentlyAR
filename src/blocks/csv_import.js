Blockly.defineBlocksWithJsonArray([
  {
    "type": "csv_import",
    "message0": "import CSV %1 %2",
    "args0": [
      {
        "type": "field_button",
        "name": "CSV_UPLOAD",
        "text": "Choose File"
      },
      {
        "type": "field_label",
        "name": "CSV_FILENAME",
        "text": "No file chosen"
      }
    ],
    "output": "Dataset",
    "colour": 230,
    "tooltip": "Import a CSV file as a dataset.",
    "helpUrl": ""
  }
]);

// Custom field_button handler for file upload and parsing
Blockly.CsvImportData = {
  data: null,
  filename: null
};

Blockly.Extensions.register('csv_import_extension', function() {
  this.getField('CSV_UPLOAD').setValidator(function() {
    // Create a hidden file input if not already present
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
              // Optionally, you could trigger a workspace event here
            }
          });
        };
        reader.readAsText(file);
      }
    };
    fileInput.value = '';
    fileInput.click();
    return null; // Don't change button text
  });
});

Blockly.Extensions.apply('csv_import_extension', Blockly.Blocks['csv_import'], true); 