// ----- define UI：一个输入数据、一个字段名、一个比较运算符、一个比较值 -----
Blockly.Blocks['filter_rows'] = {
  init: function () {
    this.appendValueInput('DATA')
        .setCheck(null)
        .appendField('过滤行：数据');

    this.appendDummyInput()
        .appendField('字段')
        .appendField(new Blockly.FieldTextInput('score'), 'FIELD');

    this.appendDummyInput()
        .appendField('条件')
        .appendField(new Blockly.FieldDropdown([
          ['=', 'eq'],
          ['≠', 'ne'],
          ['>', 'gt'],
          ['≥', 'ge'],
          ['<', 'lt'],
          ['≤', 'le'],
          ['包含(文本)', 'includes'],
          ['不包含(文本)', 'notIncludes'],
          ['为空', 'isEmpty'],
          ['非空', 'notEmpty']
        ]), 'OP');

    this.appendValueInput('VALUE')
        .setCheck(null)
        .appendField('比较值');

    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour(20); // 与 Data 类别一致或自定义
    this.setTooltip('对数组(对象)进行条件过滤，返回新数组');
    this.setHelpUrl('');
  }
};

// ----- 代码生成：输出 JS 表达式（不加分号），遵循 Blockly 表达式惯例 -----
Blockly.JavaScript['filter_rows'] = function (block) {
  const data = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE) || '[]';
  const field = block.getFieldValue('FIELD') || '';
  const op = block.getFieldValue('OP') || 'eq';
  const valueCode = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || '""';

  // 生成对每一项进行判断的表达式
  // 注意：字段名用可选链与空值合并，避免 undefined 报错
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
