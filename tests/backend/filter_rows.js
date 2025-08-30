// ----- define UI: an input dataset, a field name, a comparison operator, and a comparison value -----
Blockly.Blocks['filter_rows'] = {
  init: function () {
    this.appendValueInput('DATA')
        .setCheck(null)
        .appendField('Filter rows: data');

    this.appendDummyInput()
        .appendField('Field')
        .appendField(new Blockly.FieldTextInput('score'), 'FIELD');

    this.appendDummyInput()
        .appendField('Condition')
        .appendField(new Blockly.FieldDropdown([
          ['=', 'eq'],
          ['≠', 'ne'],
          ['>', 'gt'],
          ['≥', 'ge'],
          ['<', 'lt'],
          ['≤', 'le'],
          ['Contains (text)', 'includes'],
          ['Not contains (text)', 'notIncludes'],
          ['Is empty', 'isEmpty'],
          ['Not empty', 'notEmpty']
        ]), 'OP');

    this.appendValueInput('VALUE')
        .setCheck(null)
        .appendField('Compare value');

    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour(20); // Same as Data category or custom
    this.setTooltip('Filter an array of objects by condition, return a new array');
    this.setHelpUrl('');
  }
};

// ----- code generator: output a JS expression (no semicolon), following Blockly expression convention -----
Blockly.JavaScript['filter_rows'] = function (block) {
  const data = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE) || '[]';
  const field = block.getFieldValue('FIELD') || '';
  const op = block.getFieldValue('OP') || 'eq';
  const valueCode = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || '""';

  // Generate predicate expression for each row
  // Use optional chaining and nullish coalescing to avoid undefined errors
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
    case 'isEmpty':     predicate = `row?.[${JSON.stringify(field)}] == null || String(row?.[${JSON.stringify(field)}]).trim() === ''`; break;
    case 'notEmpty':    predicate = `!(row?.[${JSON.stringify(field)}] == null || String(row?.[${JSON.stringify(field)}]).trim() === '')`; break;
    default:            predicate = 'true';
  }

  const code = `(Array.isArray(${data}) ? ${data}.filter(row => { try { return ${predicate}; } catch(e) { return false; } }) : [])`;
  return [code, Blockly.JavaScript.ORDER_NONE];
};
