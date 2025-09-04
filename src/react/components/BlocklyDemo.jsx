import React, { useState, useEffect, useRef, useCallback } from 'react';

const BlocklyDemo = () => {
  // Refs
  const blocklyDivRef = useRef(null);
  const workspaceRef = useRef(null);
  const mainGridRef = useRef(null);
  const handle1Ref = useRef(null);
  const handle2Ref = useRef(null);
  
  // State
  const [isExecuting, setIsExecuting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [output, setOutput] = useState('');
  const [blocksWidth, setBlocksWidth] = useState(320);
  const [dataWidth, setDataWidth] = useState(360);
  
  // Constants
  const minBlocksWidth = 250;
  const maxBlocksWidth = 600;
  const minDataWidth = 300;
  const maxDataWidth = 600;
  
  // Initialize Blockly workspace
  const initBlockly = useCallback(() => {
    if (!blocklyDivRef.current || workspaceRef.current) return;
    
    // Load saved sizes from localStorage
    const savedBlocksWidth = localStorage.getItem('panelBlocksWidth');
    const savedDataWidth = localStorage.getItem('panelDataWidth');
    
    if (savedBlocksWidth) {
      setBlocksWidth(parseInt(savedBlocksWidth));
    }
    if (savedDataWidth) {
      setDataWidth(parseInt(savedDataWidth));
    }
    
    // Initialize Blockly workspace
    workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
      toolbox: document.getElementById('toolbox'),
      grid: { 
        spacing: 20, 
        length: 3, 
        colour: '#2b3350', 
        snap: true 
      },
      zoom: { 
        controls: true, 
        wheel: true, 
        startScale: 0.8, 
        maxScale: 2, 
        minScale: 0.3, 
        scaleSpeed: 1.2 
      },
      move: { 
        scrollbars: true, 
        drag: true, 
        wheel: true 
      },
      trashcan: true,
      theme: {
        base: Blockly.Themes.Dark,
        componentStyles: {
          workspaceBackgroundColour: '#0f1324',
          toolboxBackgroundColour: '#171c2b',
          toolboxForegroundColour: '#e7ebff',
          flyoutBackgroundColour: '#171c2b',
          flyoutForegroundColour: '#e7ebff',
          flyoutOpacity: 0.8,
          scrollbarColour: '#2b3350',
          insertionMarkerColour: '#6ea8fe',
          insertionMarkerOpacity: 0.3
        }
      }
    });
    
    // Mobile device detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // Initial resize with mobile detection
    setTimeout(() => {
      if (workspaceRef.current) {
        try {
          Blockly.svgResize(workspaceRef.current);
          
          // Mobile-specific adjustments
          if (isMobile || window.innerWidth <= 768) {
            // Adjust workspace scale for mobile
            const scale = Math.max(0.6, Math.min(0.8, window.innerWidth / 1000));
            if (workspaceRef.current.scale !== scale) {
              workspaceRef.current.setScale(scale);
            }
          }
        } catch (error) {
          console.warn('Resize error:', error);
        }
      }
      
      // Additional mobile initialization
      if (isMobile) {
        console.log('Mobile device detected, applying optimizations');
        if (blocklyDivRef.current) {
          blocklyDivRef.current.style.touchAction = 'pan-x pan-y';
        }
      }
    }, 100);
  }, []);
  
  // Resize workspace
  const resizeWorkspace = useCallback(() => {
    if (workspaceRef.current && blocklyDivRef.current) {
      try {
        Blockly.svgResize(workspaceRef.current);
      } catch (error) {
        console.warn('Resize error:', error);
      }
    }
  }, []);
  
  // Debounced resize function
  const debouncedResize = useCallback(() => {
    resizeWorkspace();
  }, [resizeWorkspace]);
  
  // Execute Blockly code
  const executeBlocklyCode = useCallback(() => {
    if (!workspaceRef.current) return;
    
    setIsExecuting(true);
    setOutput('');
    
    console.log('Run button clicked');
    
    try {
      console.log('Workspace blocks:', workspaceRef.current.getAllBlocks().map(b => b.type));
      console.log('CSV import generator available:', !!Blockly.JavaScript['csv_import']);
      console.log('Calling workspaceToCode...');
      
      const code = Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      console.log('Generated code:', code);
      
      if (!code.trim()) {
        setOutput('No code generated - make sure you have blocks in the workspace');
        setIsError(false);
        setIsExecuting(false);
        return;
      }
      
      // eslint-disable-next-line no-eval
      const result = eval(code);
      console.log('Execution result:', result);
      
      setOutput(result !== undefined ? String(result) : 'Code executed successfully');
      setIsError(false);
      
      // Dispatch event for automatic visualization of CSV data
      window.dispatchEvent(new CustomEvent('blocklyExecuted'));
    } catch (e) {
      console.error('Error details:', e);
      setOutput(`Error: ${e.message}`);
      setIsError(true);
    }
    
    setIsExecuting(false);
  }, []);
  
  // Show generated code
  const showBlocklyCode = useCallback(() => {
    if (!workspaceRef.current) return;
    
    console.log('Show code button clicked');
    console.log('Workspace blocks:', workspaceRef.current.getAllBlocks().map(b => b.type));
    console.log('CSV import generator available:', !!Blockly.JavaScript['csv_import']);
    
    const code = Blockly.JavaScript.workspaceToCode(workspaceRef.current);
    console.log('Generated code:', code);
    
    setOutput(code || 'No code generated');
    setIsError(false);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && !isExecuting) {
          e.preventDefault();
          executeBlocklyCode();
        } else if (e.key === 'k' && !isExecuting) {
          e.preventDefault();
          showBlocklyCode();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [executeBlocklyCode, showBlocklyCode, isExecuting]);
  
  // Initialize Blockly on mount
  useEffect(() => {
    initBlockly();
    
    // Add resize event listeners
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(debouncedResize, 300);
    });
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
      
      // Cleanup workspace
      if (workspaceRef.current) {
        try {
          workspaceRef.current.dispose();
        } catch (error) {
          console.warn('Workspace disposal warning:', error);
        }
      }
    };
  }, [initBlockly, debouncedResize]);
  
  // Panel resizing functionality
  useEffect(() => {
    let isResizing = false;
    let currentHandle = null;
    let startX = 0;
    let startBlocksWidth = blocksWidth;
    let startDataWidth = dataWidth;
    
    const handleMouseDown = (e, handleNum) => {
      isResizing = true;
      currentHandle = handleNum;
      startX = e.clientX;
      
      if (handleNum === 1 && handle1Ref.current) {
        handle1Ref.current.classList.add('dragging');
      } else if (handleNum === 2 && handle2Ref.current) {
        handle2Ref.current.classList.add('dragging');
      }
      
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };
    
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      let newBlocksWidth = startBlocksWidth;
      let newDataWidth = startDataWidth;
      
      if (currentHandle === 1) {
        // Resizing blocks panel
        newBlocksWidth = Math.max(minBlocksWidth, Math.min(maxBlocksWidth, startBlocksWidth + deltaX));
      } else if (currentHandle === 2) {
        // Resizing data panel
        newDataWidth = Math.max(minDataWidth, Math.min(maxDataWidth, startDataWidth - deltaX));
      }
      
      setBlocksWidth(newBlocksWidth);
      setDataWidth(newDataWidth);
      
      // Update Blockly workspace
      if (workspaceRef.current && currentHandle === 1) {
        requestAnimationFrame(() => {
          try {
            Blockly.svgResize(workspaceRef.current);
          } catch (error) {
            console.warn('Blockly resize error:', error);
          }
        });
      }
    };
    
    const handleMouseUp = () => {
      if (isResizing) {
        isResizing = false;
        
        // Clean up visual states
        if (handle1Ref.current) handle1Ref.current.classList.remove('dragging');
        if (handle2Ref.current) handle2Ref.current.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Save to localStorage
        localStorage.setItem('panelBlocksWidth', blocksWidth);
        localStorage.setItem('panelDataWidth', dataWidth);
        
        startBlocksWidth = blocksWidth;
        startDataWidth = dataWidth;
        currentHandle = null;
        
        // Final Blockly resize
        if (workspaceRef.current) {
          setTimeout(() => {
            try {
              Blockly.svgResize(workspaceRef.current);
            } catch (error) {
              console.warn('Blockly final resize error:', error);
            }
          }, 100);
        }
      }
    };
    
    const handleSelectStart = (e) => {
      if (isResizing) {
        e.preventDefault();
      }
    };
    
    // Add event listeners
    if (handle1Ref.current) {
      handle1Ref.current.addEventListener('mousedown', (e) => handleMouseDown(e, 1));
    }
    
    if (handle2Ref.current) {
      handle2Ref.current.addEventListener('mousedown', (e) => handleMouseDown(e, 2));
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectstart', handleSelectStart);
    
    return () => {
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [blocksWidth, dataWidth]);
  
  // Expose functions to window for compatibility
  useEffect(() => {
    window.executeBlocklyCode = executeBlocklyCode;
    window.showBlocklyCode = showBlocklyCode;
    
    return () => {
      delete window.executeBlocklyCode;
      delete window.showBlocklyCode;
    };
  }, [executeBlocklyCode, showBlocklyCode]);
  
  return (
    <div className="m-0 text-text bg-[radial-gradient(1200px_700px_at_70%_-10%,#1b2240,#0a0d18)] min-h-screen">
      <div
        ref={mainGridRef}
        className="grid h-screen overflow-hidden"
        style={{
          gridTemplateRows: '56px 1fr 120px',
          gridTemplateColumns: `${blocksWidth}px 1fr ${dataWidth}px`,
        }}
        data-areas="desktop"
      >
        {/* Resize Handle between blocks and stage */}
        <div 
          ref={handle1Ref}
          className="resize-handle resize-handle-vertical"
          style={{gridRow: 2, gridColumn: 2, marginLeft: '-4px', zIndex: 10}}
        ></div>
        
        {/* Resize Handle between stage and data */}
        <div 
          ref={handle2Ref}
          className="resize-handle resize-handle-vertical"
          style={{gridRow: 2, gridColumn: 3, marginLeft: '-4px', zIndex: 10}}
        ></div>
        
        {/* Topbar */}
        <header
          style={{gridArea: 'topbar'}}
          className="flex items-center gap-3 px-3 py-2 bg-gradient-to-b from-[#151a2a] to-[#111624] border-b border-border"
        >
          <div className="flex items-center gap-2 font-bold">
            <div
              className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-[#b28bff] grid place-items-center text-[#0a0d18] text-xs"
            >
              AR
            </div>
            <span>ApparentlyAR</span>
          </div>
          <div className="w-px h-7 bg-border mx-2"></div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Project:</span>
            <button
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5"
            >
              My AR Viz
            </button>
          </div>
          
          <div className="w-px h-7 bg-border mx-2"></div>
          
          {/* Button Panel */}
          <div className="flex items-center gap-2">
            <button 
              onClick={executeBlocklyCode}
              disabled={isExecuting}
              className="rounded-lg border border-[#2a4bff] bg-gradient-to-b from-[#2a4bff] to-[#2140d9] text-white text-sm px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExecuting && (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              {isExecuting ? 'Running...' : 'Run'} 
            </button>
            <button 
              onClick={showBlocklyCode}
              disabled={isExecuting}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Show Code
            </button>
            <button
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5"
            >
              Save
            </button>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-lg border border-accent bg-accent/10 text-accent text-sm px-3 py-1.5 hover:bg-accent/20 transition-colors font-medium"
              onClick={() => window.location.href='/hybrid-ar'}
            >
              Enter AR
            </button>
          </div>
        </header>
        
        {/* Blocks Panel */}
        <aside
          style={{gridArea: 'blocks'}}
          className="grid grid-rows-[auto,1fr] bg-panel border-r border-border overflow-hidden"
        >
          <div className="p-2 border-b border-border">
            <input
              className="w-full px-3 py-2 rounded-lg border border-border bg-[#0e1220] text-sm text-text placeholder-muted"
              placeholder="Search blocks..."
            />
          </div>
          
          {/* Blockly Workspace */}
          <div ref={blocklyDivRef} className="w-full h-full overflow-hidden bg-[#0f1324]"></div>
          
          {/* Hidden Blockly Toolbox */}
          <xml id="toolbox" style={{display: 'none'}}>
            <category name="Logic" colour="210">
              <block type="controls_if"></block>
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
              <block type="logic_negate"></block>
              <block type="logic_boolean"></block>
            </category>
            <category name="Loops" colour="120">
              <block type="controls_repeat_ext"></block>
              <block type="controls_whileUntil"></block>
            </category>
            <category name="Math" colour="230">
              <block type="math_number"></block>
              <block type="math_arithmetic"></block>
              <block type="math_single"></block>
              <block type="math_round"></block>
              <block type="math_on_list"></block>
            </category>
            <category name="Text" colour="160">
              <block type="text"></block>
              <block type="text_print"></block>
            </category>
            <category name="Lists" colour="260">
              <block type="lists_create_with"></block>
              <block type="lists_getIndex"></block>
              <block type="lists_setIndex"></block>
              <block type="lists_length"></block>
            </category>
            <category name="Variables" colour="330" custom="VARIABLE"></category>
            <category name="Functions" colour="290" custom="PROCEDURE"></category>
            <category name="Data" colour="20">
              <block type="csv_import"></block>
              <block type="to_json">
                <value name="VALUE">
                  <block type="csv_import"></block>
                </value>
              </block>
            </category>
          </xml>
        </aside>
        
        {/* Stage / Visualization Area */}
        <section
          style={{gridArea: 'stage'}}
          className="relative grid grid-rows-[44px,1fr] bg-gradient-to-b from-[#0f1324] to-[#0b0f1c]"
        >
          <div
            className="flex items-center gap-2 p-2 border-b border-border bg-[#13182a]"
          >
            {/* Chart Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs"
                >Dataset</span>
                <select 
                  className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  <option value="students">Students Data</option>
                  <option value="weather">Weather Data</option>
                  <option value="sales">Sales Data</option>
                  <option value="block">Block Data</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs"
                >Type</span>
                <select 
                  className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="doughnut">Doughnut Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="histogram">Histogram</option>
                  <option value="boxplot">Box Plot</option>
                  <option value="heatmap">Heatmap</option>
                  <option value="radar">Radar Chart</option>
                </select>
              </div>
              
              <button 
                className="rounded-lg border border-[#2a4bff] bg-gradient-to-b from-[#2a4bff] to-[#2140d9] text-white text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Generate Chart
              </button>
            </div>
          </div>
          
          {/* Visualization Container */}
          <div
            className="relative m-3 rounded-2xl border border-border overflow-hidden"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, #11182c, #121a31, #10172b, #11182c)'
            }}
          >
            {/* Chart Component */}
            <div id="react-chart-container" className="w-full h-full min-h-[400px] grid place-items-center text-muted">
              <div className="text-sm text-muted">
                Visualization will appear here when blocks are executed
              </div>
            </div>
          </div>
        </section>
        
        {/* Data Panel */}
        <aside
          style={{gridArea: 'data'}}
          className="grid grid-rows-[44px,auto,1fr] bg-panel border-l border-border"
        >
          <div
            className="flex items-center gap-2 p-2 border-b border-border bg-[#151a2c]"
          >
            <strong>Data Panel</strong>
          </div>
          
          <div className="overflow-auto p-2">
            <div className="text-sm text-muted text-center py-8">
              Data will appear here when imported via blocks
            </div>
          </div>
        </aside>
        
        {/* Guide / Console */}
        <footer
          style={{gridArea: 'guide'}}
          className="flex items-center gap-3 px-3 py-2 bg-[#111524] border-t border-border"
        >
          {/* Output Display */}
          <div className="flex-1 mx-2">
            {output && (
              <pre className={`p-2 rounded-lg font-mono text-xs border max-h-16 overflow-auto ${
                isError 
                  ? 'bg-[#2b1f1f] text-error border-[#4a2e2e]' 
                  : 'bg-chip text-text border-border'
              }`}>
                {output}
              </pre>
            )}
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            {/* Status Indicator */}
            {isExecuting && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">
                <div className="animate-spin h-3 w-3 border border-muted border-t-transparent rounded-full"></div>
                Executing...
              </span>
            )}
            {!isExecuting && output && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${
                isError 
                  ? 'bg-[#2b1f1f] text-error border-[#4a2e2e]' 
                  : 'bg-[#1a2b24] text-ok border-[#2e5a49]'
              }`}>
                {isError ? 'Error' : 'Ready'}
              </span>
            )}
          </div>
        </footer>
      </div>
      
      <style jsx>{`
        /* Grid template areas utility */
        [data-areas="desktop"] {
          grid-template-areas:
            "topbar topbar topbar"
            "blocks stage data"
            "guide guide guide";
        }
        @media (max-width: 980px) {
          [data-areas="desktop"] {
            grid-template-areas:
              "topbar"
              "stage"
              "blocks"
              "data"
              "guide";
            grid-template-columns: 1fr !important;
            grid-template-rows: 56px 1fr auto auto 140px !important;
            height: auto !important;
            min-height: 100vh;
          }
        }
        .camera-checker {
          background-image: linear-gradient(45deg, #1b2441 25%, transparent 25%),
            linear-gradient(-45deg, #1b2441 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1b2441 75%),
            linear-gradient(-45deg, transparent 75%, #1b2441 75%);
          background-size: 24px 24px;
          background-position: 0 0, 0 12px, 12px -12px, -12px 0px;
        }
        
        /* Blockly styling adjustments for dark theme */
        .blocklyToolboxDiv {
          background-color: #171c2b !important;
          border-right: 1px solid #2b3350 !important;
        }
        
        .blocklyFlyoutBackground {
          fill: #171c2b !important;
        }
        
        .blocklyMainBackground {
          fill: #0f1324 !important;
        }
        
        .blocklyScrollbarBackground {
          fill: #1e2436 !important;
        }
        
        .blocklyScrollbarHandle {
          fill: #a9b4d0 !important;
        }
        
        .blocklyText {
          fill: #e7ebff !important;
        }
        
        /* Chart.js mobile responsiveness */
        .chart-container {
          position: relative;
          width: 100%;
        }
        
        @media (max-width: 640px) {
          .chart-container {
            height: 300px !important;
          }
          
          .chart-container canvas {
            max-width: 100% !important;
            height: auto !important;
          }
        }
        
        /* Resize handles */
        .resize-handle {
          position: relative;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .resize-handle-vertical {
          width: 8px;
          height: 100%;
          cursor: col-resize;
          background: transparent;
          border-left: 1px solid transparent;
          transition: all 0.2s ease;
        }
        
        .resize-handle-vertical:hover {
          background: rgba(110, 168, 254, 0.1);
          border-left: 1px solid #6ea8fe;
        }
        
        .resize-handle-vertical:active,
        .resize-handle-vertical.dragging {
          background: rgba(110, 168, 254, 0.2);
          border-left: 2px solid #6ea8fe;
          cursor: col-resize;
        }
        
        /* Visual indicator dots */
        .resize-handle-vertical::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 2px;
          height: 20px;
          background: #a9b4d0;
          border-radius: 1px;
          opacity: 0.3;
          transition: opacity 0.2s ease;
        }
        
        .resize-handle-vertical:hover::before,
        .resize-handle-vertical.dragging::before {
          opacity: 0.8;
          background: #6ea8fe;
        }
        
        /* Hide resize handles on mobile */
        @media (max-width: 980px) {
          .resize-handle {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default BlocklyDemo;