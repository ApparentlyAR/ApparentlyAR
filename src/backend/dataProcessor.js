/**
 * Data Processor Module
 *
 * Handles data transformation, filtering, sorting, aggregation, and analysis
 * for the ApparentlyAR data visualization platform.
 *
 * @author ApparentlyAR Team
 * @version 1.1.0
 */

const fs = require('fs');
const crypto = require('crypto');
const Papa = require('papaparse');

class DataProcessor {
  constructor() {
    // Bind methods (stable this)
    this.processData = this.processData.bind(this);
    this.parseCSVFile = this.parseCSVFile.bind(this);

    // Core ops
    this.filterData = this.filterData.bind(this);
    this.sortData = this.sortData.bind(this);
    this.aggregateData = this.aggregateData.bind(this);
    this.selectColumns = this.selectColumns.bind(this);
    this.groupByData = this.groupByData.bind(this);
    this.calculateColumn = this.calculateColumn.bind(this);

    // New cleaning ops
    this.convertType = this.convertType.bind(this);
    this.dropColumn = this.dropColumn.bind(this);
    this.renameColumn = this.renameColumn.bind(this);
    this.handleMissing = this.handleMissing.bind(this);

    /**
     * Supported data processing operations
     * Keys must match the `type` emitted by blocks / Professor.
     */
    this.supportedOperations = {
      // Transform / cleaning
      convertType: this.convertType,
      dropColumn: this.dropColumn,
      renameColumn: this.renameColumn,
      handleMissing: this.handleMissing,

      // Analysis pipeline
      filter: this.filterData,
      sort: this.sortData,
      aggregate: this.aggregateData,
      select: this.selectColumns,
      groupBy: this.groupByData,
      calculate: this.calculateColumn
    };
  }

  /* =============================== *
   * Utilities (deterministic & safe)
   * =============================== */

  _deepClone(obj) {
    // Fast deterministic clone for JSON-compatible data
    return JSON.parse(JSON.stringify(obj));
  }

  _isMissing(v) {
    return v === null || v === undefined || v === '';
  }

  _toNumber(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  }

  _toText(v) {
    if (v === null || v === undefined) return '';
    return String(v);
  }

  _toDate(v) {
    // Deterministic date parse: accept Date, timestamp, or ISO-ish strings
    if (v instanceof Date) return v;
    if (typeof v === 'number') return new Date(v);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  _stableCompare(a, b) {
    if (a === b) return 0;
    // NaN handling: push NaN to the end consistently
    const aNaN = Number.isNaN(a);
    const bNaN = Number.isNaN(b);
    if (aNaN && bNaN) return 0;
    if (aNaN) return 1;
    if (bNaN) return -1;
    return a > b ? 1 : -1;
  }

  _schemaOf(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return {};
    const first = rows[0];
    const schema = {};
    for (const key of Object.keys(first)) {
      const val = first[key];
      let t = typeof val;
      if (val instanceof Date) t = 'date';
      schema[key] = t;
    }
    return schema;
  }

  _fingerprint(data) {
    // Canonical JSON string then SHA-256
    const json = JSON.stringify(data);
    return 'sha256:' + crypto.createHash('sha256').update(json).digest('hex');
    // Note: For large datasets consider streaming or columnar hashing.
  }

  /* =============================== *
   * CSV parsing
   * =============================== */

  /**
   * Parse CSV file and return structured data
   * @param {string} filePath
   * @returns {Promise<Array<Object>>}
   */
  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // keep raw; conversion via operations
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => reject(new Error(`CSV parsing failed: ${error.message}`))
      });
    });
  }

  /* =============================== *
   * Pipeline execution
   * =============================== */

  /**
   * Process data with a series of operations
   * @param {Array<Object>} data
   * @param {Array<{type:string, params:Object}>} operations
   * @returns {Promise<Array|*>} Processed data (usually Array; `aggregate` returns scalar)
   */
  async processData(data, operations) {
    let processedData = this._deepClone(data);

    for (const operation of operations) {
      const { type, params } = operation || {};
      const fn = this.supportedOperations[type];
      if (!fn) throw new Error(`Unsupported operation: ${type}`);
      processedData = await fn(processedData, params);
    }

    return processedData;
  }

  /* =============================== *
   * Cleaning / Transform operations
   * =============================== */

  /**
   * convertType({ column, dataType: 'number'|'text'|'date' })
   */
  convertType(data, { column, dataType }) {
    return data.map(row => {
      const v = row?.[column];
      if (this._isMissing(v)) return { ...row };
      let nv = v;
      try {
        if (dataType === 'number') nv = this._toNumber(v);
        else if (dataType === 'text') nv = this._toText(v);
        else if (dataType === 'date') nv = this._toDate(v);
      } catch {
        // keep original on failure
      }
      return { ...row, [column]: nv };
    });
  }

  /**
   * dropColumn({ column })
   */
  dropColumn(data, { column }) {
    return data.map(row => {
      const { [column]: _omit, ...rest } = row;
      return rest;
    });
  }

  /**
   * renameColumn({ oldName, newName })
   */
  renameColumn(data, { oldName, newName }) {
    return data.map(row => {
      if (!Object.prototype.hasOwnProperty.call(row, oldName)) return { ...row };
      const { [oldName]: val, ...rest } = row;
      return { ...rest, [newName]: val };
    });
  }

  /**
   * handleMissing({ column, method: 'remove'|'fill'|'fill_average'|'fill_median', fillValue? })
   */
  handleMissing(data, { column, method, fillValue }) {
    if (method === 'remove') {
      return data.filter(r => !this._isMissing(r[column]));
    }
    if (method === 'fill') {
      return data.map(r => {
        if (this._isMissing(r[column])) return { ...r, [column]: fillValue };
        return r;
      });
    }
    if (method === 'fill_average' || method === 'fill_median') {
      const nums = data
        .map(r => this._toNumber(r[column]))
        .filter(v => !Number.isNaN(v))
        .sort((a, b) => a - b);

      const avg = nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
      let med = null;
      if (nums.length) {
        const mid = Math.floor(nums.length / 2);
        med = (nums.length % 2) ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      }
      const fill = method === 'fill_average' ? avg : med;

      return data.map(r => {
        if (this._isMissing(r[column]) && fill !== null) return { ...r, [column]: fill };
        return r;
      });
    }
    return data;
  }

  /* =============================== *
   * Analysis / Compute operations
   * =============================== */

  /**
   * filter({ column, operator, value })
   * operators: equals, not_equals, greater_than, less_than, greater_than_or_equal,
   *            less_than_or_equal, contains, starts_with, ends_with
   */
  filterData(data, { column, operator, value }) {
    return data.filter(row => {
      const cellValue = row[column];

      switch (operator) {
        case 'equals':                 return cellValue == value;
        case 'not_equals':             return cellValue != value;
        case 'greater_than':           return this._toNumber(cellValue) >  this._toNumber(value);
        case 'less_than':              return this._toNumber(cellValue) <  this._toNumber(value);
        case 'greater_than_or_equal':  return this._toNumber(cellValue) >= this._toNumber(value);
        case 'less_than_or_equal':     return this._toNumber(cellValue) <= this._toNumber(value);
        case 'contains':               return this._toText(cellValue).toLowerCase().includes(this._toText(value).toLowerCase());
        case 'starts_with':            return this._toText(cellValue).toLowerCase().startsWith(this._toText(value).toLowerCase());
        case 'ends_with':              return this._toText(cellValue).toLowerCase().endsWith(this._toText(value).toLowerCase());
        default:                       return true;
      }
    });
  }

  /**
   * sort({ column, direction: 'asc'|'desc' })
   */
  sortData(data, { column, direction = 'asc' }) {
    const out = this._deepClone(data);
    out.sort((a, b) => {
      let av = a[column];
      let bv = b[column];

      // Try numeric compare first
      const an = this._toNumber(av);
      const bn = this._toNumber(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) {
        return direction === 'asc' ? this._stableCompare(an, bn) : this._stableCompare(bn, an);
      }

      // Fallback to string compare (case-insensitive)
      av = this._toText(av).toLowerCase();
      bv = this._toText(bv).toLowerCase();
      return direction === 'asc' ? this._stableCompare(av, bv) : this._stableCompare(bv, av);
    });
    return out;
  }

  /**
   * aggregate({ column, operation: 'sum'|'average'|'count'|'min'|'max' })
   * NOTE: Returns a scalar number (backwards-compatible with your original code).
   */
  aggregateData(data, { column, operation }) {
    const values = data.map(r => this._toNumber(r[column])).filter(v => !Number.isNaN(v));

    switch (operation) {
      case 'sum':     return values.reduce((s, v) => s + v, 0);
      case 'average': return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
      case 'count':   return values.length;
      case 'min':     return values.length ? Math.min(...values) : null;
      case 'max':     return values.length ? Math.max(...values) : null;
      default:        throw new Error(`Unsupported aggregation operation: ${operation}`);
    }
  }

  /**
   * select({ columns: string[] })
   */
  selectColumns(data, { columns }) {
    return data.map(row => {
      const newRow = {};
      for (const col of columns) {
        if (Object.prototype.hasOwnProperty.call(row, col)) newRow[col] = row[col];
      }
      return newRow;
    });
  }

  /**
   * groupBy({ groupBy: string, aggregations: [{column, operation, alias}] })
   * Returns array of grouped rows with aggregation results.
   */
  groupByData(data, { groupBy, aggregations }) {
    const groups = {};
    for (const row of data) {
      const key = row[groupBy];
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }

    const out = [];
    for (const key of Object.keys(groups)) {
      const bucket = groups[key];
      const result = { [groupBy]: key };
      for (const agg of aggregations || []) {
        const { column, operation, alias } = agg;
        const vals = bucket.map(r => this._toNumber(r[column])).filter(v => !Number.isNaN(v));
        let val = null;
        switch (operation) {
          case 'sum':     val = vals.reduce((s, v) => s + v, 0); break;
          case 'average': val = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0; break;
          case 'count':   val = vals.length; break;
          case 'min':     val = vals.length ? Math.min(...vals) : null; break;
          case 'max':     val = vals.length ? Math.max(...vals) : null; break;
          default:        val = null;
        }
        result[alias || `${operation}(${column})`] = val;
      }
      out.push(result);
    }
    return out;
  }

  /**
   * calculate({ expression, newColumnName })
   * WARNING: uses eval() for demo purposes; replace with a sandboxed parser in production.
   */
  calculateColumn(data, { expression, newColumnName }) {
    return data.map(row => {
      try {
        let expr = String(expression);

        // Replace bareword column references with their values.
        // Very simple substitution: col names should be safe JS identifiers for best results.
        for (const col of Object.keys(row)) {
          const re = new RegExp(`\\b${col}\\b`, 'g');
          expr = expr.replace(re, `${JSON.stringify(row[col])}`);
        }

        // Evaluate; non-number becomes null for consistency with numeric derivations.
        // eslint-disable-next-line no-eval
        const result = eval(expr);
        return { ...row, [newColumnName]: Number.isFinite(result) ? result : null };
      } catch {
        return { ...row, [newColumnName]: null };
      }
    });
  }

  /* =============================== *
   * Summaries / metadata
   * =============================== */

  /**
   * getDataSummary(data) -> { rows, columns, summary: {col: {type, count, unique, min?, max?, average?}}, schema, fingerprint }
   */
  getDataSummary(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { rows: 0, columns: 0, summary: {}, schema: {}, fingerprint: this._fingerprint([]) };
    }

    const cols = Object.keys(data[0] || {});
    const summary = {};

    for (const col of cols) {
      const values = data.map(r => r[col]).filter(v => !this._isMissing(v));
      const nums = values.map(v => this._toNumber(v)).filter(v => !Number.isNaN(v));
      const allNumeric = nums.length === values.length && values.length > 0;

      const item = {
        type: allNumeric ? 'numeric' : (values[0] instanceof Date ? 'date' : 'text'),
        count: values.length,
        unique: new Set(values.map(v => (v instanceof Date ? v.toISOString() : v))).size
      };

      if (allNumeric) {
        item.min = Math.min(...nums);
        item.max = Math.max(...nums);
        item.average = nums.reduce((s, v) => s + v, 0) / nums.length;
      }

      summary[col] = item;
    }

    return {
      rows: data.length,
      columns: cols.length,
      summary,
      schema: this._schemaOf(data),
      fingerprint: this._fingerprint(data)
    };
  }

  /**
   * List supported operation names
   */
  getAvailableOperations() {
    return Object.keys(this.supportedOperations);
  }
}

module.exports = new DataProcessor();
