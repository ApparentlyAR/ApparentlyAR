// ---------- 1) 注册自定义字段（必须在定义 block 之前） ----------
class FieldFileButton extends Blockly.Field {
  constructor(value, validator) {
    super(value || 'Upload', validator);
    this._dialogOpen = false;
  }
  static fromJson(options) {           // 允许 JSON/程序式两种用法
    return new FieldFileButton(options['value']);
  }
  showEditor_() {
    if (this._dialogOpen) return;
    this._dialogOpen = true;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) { cleanup(); return; }
      const reader = new FileReader();
      reader.onload = () => {
        // 把文件名显示到标签上，把文本挂在 block 实例上备用
        const block = this.getSourceBlock();
        if (block) {
          block.csv_filename = file.name;
          block.csv_text = String(reader.result || '');
          block.setFieldValue(file.name, 'CSV_FILENAME');
        }
        cleanup();
      };
      reader.onerror = cleanup;
      reader.readAsText(file);
    };

    const cleanup = () => {
      this._dialogOpen = false;
      if (input && input.parentNode) input.parentNode.removeChild(input);
    };

    input.click();
  }
}
// v10+ 用 fieldRegistry
Blockly.fieldRegistry.register('field_file_button', FieldFileButton);

// ---------- 2) 定义 csv_import 积木（程序式，避免 JSON 未注册字段时报错） ----------
Blockly.Blocks['csv_import'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('import CSV')
      .appendField(new Blockly.FieldLabel('No file chosen'), 'CSV_FILENAME')
      .appendField(new FieldFileButton('Upload'), 'CSV_UPLOAD');
    this.setOutput(true, 'Dataset');
    this.setColour(20);
    this.setTooltip('Import a CSV file as a dataset.');
  }
};
