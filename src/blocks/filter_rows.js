/* ==== Block Definition ==== */
Blockly.Blocks['filter_rows'] = {
  init: function () {
    this.appendValueInput('DATA')
        .setCheck(null)
        .appendField('Filter rows: data');

    this.appendDummyInput()
        .appendField('field')
        .appendField(new Blockly.FieldTextInput('score'), 'FIELD');

    this.appendDummyInput()
        .appendField('op')
        .appendField(new Blockly.FieldDropdown([
          ['=', 'eq'],
          ['≠', 'ne'],
          ['>', 'gt'],
          ['≥', 'ge'],
          ['<', 'lt'],
          ['≤', 'le'],
          ['includes (text)', 'includes'],
          ['not includes (text)', 'notIncludes'],
          ['is empty', 'isEmpty'],
          ['not empty', 'notEmpty']
        ]), 'OP');

    this.appendValueInput('VALUE')
        .setCheck(null)
        .appendField('value');

    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour(20); 
    this.setTooltip('Filter an array of objects by a condition.');
    this.setHelpUrl('');
  }
};

/* ==== Generator (robust registration) ==== */
(function () {
  const gen = (typeof Blockly !== 'undefined' && Blockly.JavaScript)
           || (typeof window !== 'undefined' && window.javascriptGenerator);

  if (!gen) {
    console.error('[filter_rows] JavaScript generator not found. Load javascript_compressed.js before this file.');
    return;
  }

  function emit(block) {
    const data = gen.valueToCode(block, 'DATA', gen.ORDER_NONE) || '[]';
    const field = block.getFieldValue('FIELD') || '';
    const op    = block.getFieldValue('OP')    || 'eq';
    const valueCode = gen.valueToCode(block, 'VALUE', gen.ORDER_NONE) || '""';

    let predicate;
    switch (op) {
      case 'eq':          predicate = `(row?.[${JSON.stringify(field)}] ?? null) == (${valueCode})`; break;
      case 'ne':          predicate = `(row?.[${JSON.stringify(field)}] ?? null) != (${valueCode})`; break;
      case 'gt':          predicate = `Number(row?.[${JSON.stringify(field)}]) > Number(${valueCode})`; break;
      case 'ge':          predicate = `Number(row?.[${JSON.stringify(field)}]) >= Number(${valueCode})`; break;
      case 'lt':          predicate = `Number(row?.[${JSON.stringify(field)}]) < Number(${valueCode})`; break;
      case 'le':          predicate = `Number(row?.[${JSON.stringify(field)}]) <= Number(${valueCode})`; break;
      case 'includes':    predicate = `String(row?.[${JSON.stringify(field)}] ?? '').includes(String(${valueCode}))`; break;
      case 'notIncludes': predicate = `!String(row?.[${JSON.stringify(field)}] ?? '').includes(String(${valueCode}))`; break;
      case 'isEmpty':     predicate = `(row?.[${JSON.stringify(field)}] == null) || String(row?.[${JSON.stringify(field)}]).trim() === ''`; break;
      case 'notEmpty':    predicate = `!( (row?.[${JSON.stringify(field)}] == null) || String(row?.[${JSON.stringify(field)}]).trim() === '' )`; break;
      default:            predicate = 'true';
    }

    const code = `(Array.isArray(${data}) ? ${data}.filter(row => { try { return ${predicate}; } catch(e) { return false; } }) : [])`;
    return [code, gen.ORDER_NONE];
  }

  // regestration to blocky
  gen['filter_rows'] = emit;
  if (gen.forBlock) gen.forBlock['filter_rows'] = emit;

  console.log('[filter_rows] generator registered OK');
})();
