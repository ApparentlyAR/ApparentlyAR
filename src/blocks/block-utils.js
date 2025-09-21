/**
 * Block Utilities
 * Shared utilities and helper functions for custom Blockly blocks
 * in the ApparentlyAR data visualization platform.
 */

// ---------------------------------------------------------------------
// Global namespace
// ---------------------------------------------------------------------
window.BlockUtils = window.BlockUtils || {};

// ---------------------------------------------------------------------
// Pipeline (optional helpers)
// ---------------------------------------------------------------------
window.BlockUtils.DataPipeline = {
  currentData: null,
  operations: [],
  setCurrentData(data) { this.currentData = data; },
  getCurrentData() { return this.currentData; },
  addOperation(op) { this.operations.push(op); },
  clear() { this.currentData = null; this.operations = []; }
};

// ---------------------------------------------------------------------
// API helpers (optional; safe no-op if backend not present)
// ---------------------------------------------------------------------
window.BlockUtils.API = {
  async processData(data, operations) {
    const res = await fetch('/api/process-data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, operations })
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
  async generateChart(data, chartType, options) {
    const res = await fetch('/api/generate-chart', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, chartType, options })
    });
    if (!res.ok) throw new Error(`Chart API Error: ${res.status}`);
    return res.json();
  }
};

// ---------------------------------------------------------------------
// Code generator registration helper
// ---------------------------------------------------------------------
window.BlockUtils.registerBlock = function (blockType, generator) {
  if (typeof Blockly === 'undefined' || !Blockly.JavaScript) return;
  try { Object.defineProperty(Blockly.JavaScript, blockType, { value: generator, configurable: true }); }
  catch { Blockly.JavaScript[blockType] = generator; }
  if (Blockly.JavaScript.forBlock) {
    try { Object.defineProperty(Blockly.JavaScript.forBlock, blockType, { value: generator, configurable: true }); }
    catch { Blockly.JavaScript.forBlock[blockType] = generator; }
  }
  if (window.Blockly?.JavaScript) {
    try { Object.defineProperty(window.Blockly.JavaScript, blockType, { value: generator, configurable: true }); }
    catch { window.Blockly.JavaScript[blockType] = generator; }
  }
};

// ---------------------------------------------------------------------
// Common quick field builders (not the dynamic column one)
// ---------------------------------------------------------------------
window.BlockUtils.Fields = {
  createOperatorDropdown(name = 'OPERATOR') {
    return {
      type: 'field_dropdown', name,
      options: [
        ['equals', 'equals'],
        ['not equals', 'not_equals'],
        ['greater than', 'greater_than'],
        ['less than', 'less_than'],
        ['greater than or equal', 'greater_than_equal'],
        ['less than or equal', 'less_than_equal'],
        ['contains', 'contains'],
        ['does not contain', 'not_contains']
      ]
    };
  },
  createChartTypeDropdown(name = 'CHART_TYPE') {
    return {
      type: 'field_dropdown', name,
      options: [
        ['Bar Chart', 'bar'], ['Line Chart', 'line'], ['Scatter Plot', 'scatter'],
        ['Pie Chart', 'pie'], ['Doughnut Chart', 'doughnut'], ['Area Chart', 'area'],
        ['Histogram', 'histogram'], ['Box Plot', 'boxplot'], ['Heatmap', 'heatmap'],
        ['Radar Chart', 'radar']
      ]
    };
  },
  createAggregationDropdown(name = 'FUNCTION') {
    return {
      type: 'field_dropdown', name,
      options: [['Sum', 'sum'], ['Average', 'average'], ['Count', 'count'], ['Minimum', 'min'], ['Maximum', 'max']]
    };
  },
  createTypeDropdown(name = 'TYPE') {
    return {
      type: 'field_dropdown', name,
      options: [['Number', 'number'], ['Text', 'text'], ['Date', 'date']]
    };
  }
};

// ---------------------------------------------------------------------
// Validators (optional)
// ---------------------------------------------------------------------
window.BlockUtils.Validators = {
  validateDataArray(data) {
    if (!Array.isArray(data)) throw new Error('Input must be a dataset (array of objects)');
    return true;
  },
  validateColumn(data, columnName) {
    if (!data || !data.length) return true;
    if (!Object.prototype.hasOwnProperty.call(data[0], columnName)) {
      throw new Error(`Column "${columnName}" does not exist in dataset`);
    }
    return true;
  },
  validateNumericColumn(data, columnName) {
    this.validateColumn(data, columnName);
    const sample = data.slice(0, 10);
    const bad = sample.some(row =>
      row[columnName] !== null && row[columnName] !== undefined && row[columnName] !== '' &&
      isNaN(Number(row[columnName]))
    );
    if (bad) throw new Error(`Column "${columnName}" contains non-numeric values`);
    return true;
  }
};

// ---------------------------------------------------------------------
// Column Registry (single source of truth for dynamic column dropdowns)
// ---------------------------------------------------------------------
window.BlockUtils.ColumnRegistry = {
  columns: [],
  dataTypes: {},
  csvData: null,
  listeners: [],

  updateColumns(csvData) {
    if (!Array.isArray(csvData) || !csvData.length) {
      this.columns = []; this.dataTypes = {}; this.csvData = null;
    } else {
      this.columns = Object.keys(csvData[0]);
      this.csvData = csvData;
      this.dataTypes = this.detectDataTypes(csvData);
    }
    this.notifyListeners();
  },

  // Direct set by name list (e.g., when you already normalized headers)
  setColumnsByName(fields = []) {
    this.columns = Array.isArray(fields) ? fields.slice() : [];
    this.dataTypes = {};
    if (this.csvData) this.dataTypes = this.detectDataTypes(this.csvData);
    this.notifyListeners();
  },

  getDropdownOptions() {
    try {
      if (!this.columns || !this.columns.length) {
        return [['No columns available - load CSV first', '_no_columns']];
      }
      const opts = this.columns.map(col => {
        const type = this.dataTypes[col] || 'unknown';
        return [`${col} (${type})`, col];
      });
      const valid = opts.filter(o => Array.isArray(o) && o.length === 2 && typeof o[0] === 'string' && typeof o[1] === 'string');
      return valid.length ? valid : [['No valid columns', '_no_columns']];
    } catch (e) {
      console.warn('Error generating dropdown options:', e);
      return [['Error loading columns', '_error']];
    }
  },

  detectDataTypes(csvData) {
    const types = {};
    const sampleSize = Math.min(10, csvData.length);
    this.columns.forEach(col => {
      let num = 0, dt = 0, tot = 0;
      for (let i = 0; i < sampleSize; i++) {
        const v = csvData[i][col];
        if (v !== null && v !== undefined && v !== '') {
          tot++;
          const n = Number(v); if (!isNaN(n) && isFinite(n)) num++;
          const d = new Date(v); if (!isNaN(d.getTime()) && String(v).length > 4) dt++;
        }
      }
      types[col] = tot === 0 ? 'empty' : (num > tot * 0.7 ? 'number' : (dt > tot * 0.7 ? 'date' : 'text'));
    });
    return types;
  },

  addListener(l) { if (this.listeners.indexOf(l) === -1) this.listeners.push(l); },
  removeListener(l) { this.listeners = this.listeners.filter(x => x !== l); },
  notifyListeners() {
    this.listeners.forEach(l => {
      try { l?.updateFromRegistry?.(); } catch (e) { console.warn('Error updating column dropdown:', e); }
    });
  },
  clear() { this.columns = []; this.dataTypes = {}; this.csvData = null; this.notifyListeners(); }
};

// Quick helpers for csv_import.js compatibility (optional but handy)
window.BlockUtils.setCurrentColumns = function (fields, { refresh = true } = {}) {
  window.BlockUtils.ColumnRegistry.setColumnsByName(fields);
  if (refresh) {
    // If your custom field exposes a static refreshAll, use it; else fallback
    const ctor = Blockly.fieldRegistry?.get?.('field_column_dropdown');
    if (ctor?.refreshAll) ctor.refreshAll(Blockly.getMainWorkspace());
    else Blockly.getMainWorkspace().refreshToolboxSelection();
  }
};
window.BlockUtils.getCurrentColumns = function () {
  return window.BlockUtils.ColumnRegistry.columns.slice();
};

// ---------------------------------------------------------------------
// Update Data Panel (also drives ColumnRegistry updates)
// ---------------------------------------------------------------------
window.BlockUtils.updateDataPanel = function (data) {
  if (Array.isArray(data) && data.length) {
    window.BlockUtils.DataPipeline.setCurrentData(data);
    window.BlockUtils.ColumnRegistry.updateColumns(data);

    // Optional: render preview string to a React state if present
    if (window.reactSetOutput) {
      const cols = Object.keys(data[0]);
      const preview = JSON.stringify(data.slice(0, 5), null, 2);
      window.reactSetOutput(
        `CSV Data Loaded: ${data.length} rows, ${cols.length} columns\n\n` +
        `Columns: ${cols.join(', ')}\n\nPreview (first 5 rows):\n${preview}`
      );
    }
  } else {
    window.BlockUtils.ColumnRegistry.clear();
    if (window.reactSetOutput) window.reactSetOutput('No data available');
  }
};

// ---------------------------------------------------------------------
// Dynamic Column Dropdown Field (the important part)
// ---------------------------------------------------------------------
window.BlockUtils.FieldColumnDropdown = class extends Blockly.FieldDropdown {
  constructor(checkType = null) {
    // Use a FUNCTION generator so each open pulls the latest options
    const generator = () => window.BlockUtils.ColumnRegistry.getDropdownOptions();
    super(generator);
    this.checkType_ = checkType;

    // Register as a listener -> will call updateFromRegistry() on changes
    try { window.BlockUtils.ColumnRegistry.addListener(this); }
    catch (e) { console.warn('Failed to register column dropdown listener:', e); }
  }

  static get SERIALIZABLE() { return true; }

  static fromJson(options) {
    const checkType = options.checkType || null;
    // Provide a default option to satisfy Blockly during initial parse
    const tmp = [['Loading columns...', '_loading']];
    const field = new window.BlockUtils.FieldColumnDropdown(checkType);
    // Make sure a temporary value exists until first update
    if (!field.getValue()) field.setValue(tmp[0][1]);
    return field;
  }

  // Called when ColumnRegistry updates
  updateFromRegistry() {
    try {
      // Rebuild generator to always reflect latest options with optional type filter
      this.menuGenerator_ = () => {
        let options = window.BlockUtils.ColumnRegistry.getDropdownOptions();

        // Filter by datatype if requested (keep placeholders starting with '_')
        if (this.checkType_ && window.BlockUtils.ColumnRegistry.columns.length) {
          const filtered = options.filter(([label, value]) => {
            if (value.startsWith('_')) return true;
            const t = window.BlockUtils.ColumnRegistry.dataTypes[value];
            return t === this.checkType_;
          });
          options = filtered.length ? filtered : [[`No ${this.checkType_} columns available`, `_no_${this.checkType_}`]];
        }
        return options;
      };

      // If current value invalid or placeholder, try set to first real column
      const cols = window.BlockUtils.ColumnRegistry.columns.map(String);
      const cur = this.getValue() || '';
      if (!cols.includes(cur) || cur.startsWith('_')) {
        if (cols.length) this.setValue(cols[0]);
      }

      // Force re-render (compatible across Blockly versions)
      if (typeof this.forceRerender === 'function') this.forceRerender();
      else if (this.sourceBlock_?.render) this.sourceBlock_.render();

    } catch (e) {
      console.warn('updateFromRegistry error:', e);
    }
  }

  dispose() {
    try { window.BlockUtils.ColumnRegistry.removeListener(this); }
    finally { super.dispose(); }
  }
};

// Register custom field
if (typeof Blockly !== 'undefined' && Blockly.fieldRegistry) {
  Blockly.fieldRegistry.register('field_column_dropdown', window.BlockUtils.FieldColumnDropdown);
}

// Convenience creators for typed dropdowns
window.BlockUtils.Fields.createNumberColumnDropdown = function (name = 'COLUMN') {
  return { type: 'field_column_dropdown', name, checkType: 'number' };
};
window.BlockUtils.Fields.createTextColumnDropdown = function (name = 'COLUMN') {
  return { type: 'field_column_dropdown', name, checkType: 'text' };
};
window.BlockUtils.Fields.createDateColumnDropdown = function (name = 'COLUMN') {
  return { type: 'field_column_dropdown', name, checkType: 'date' };
};

// Category colors (optional)
window.BlockUtils.Colors = {
  DATA_CLEANING: 20,
  DATA_FILTERING: 120,
  DATA_TRANSFORM: 260,
  VISUALIZATION: 330
};
