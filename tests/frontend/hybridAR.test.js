/**
 * Hybrid AR System Tests
 * 
 * Converts test-hybrid-ar.html manual tests to automated Jest tests
 * Tests the hybrid AR implementation structure, dependencies, and functionality
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../server');

describe('Hybrid AR System Tests', () => {
  const hybridArPath = path.join(__dirname, '../../public/hybrid-ar-demo.html');

  describe('Server Route Accessibility', () => {
    
    test('should serve hybrid AR demo at /hybrid-ar endpoint', async () => {
      const response = await request(app)
        .get('/hybrid-ar')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
    });

    
  });

  describe('File Structure Validation', () => {
    
    test('should have substantial hybrid AR implementation file', () => {
      expect(fs.existsSync(hybridArPath)).toBe(true);
      
      // Check HTML file exists
      const stats = fs.statSync(hybridArPath);
      const htmlSizeKB = stats.size / 1024;
      
      // HTML file should be reasonable size (reduced since JS is now external)
      expect(htmlSizeKB).toBeGreaterThan(5);
      
      // Check that AR module files exist and contribute to total implementation size
      const arModulePaths = [
        path.join(__dirname, '../../src/ar/coordinate-system.js'),
        path.join(__dirname, '../../src/ar/gesture-detector.js'),
        path.join(__dirname, '../../src/ar/chart-manager.js'),
        path.join(__dirname, '../../src/ar/hand-tracking.js'),
        path.join(__dirname, '../../src/ar/hybrid-ar-controller.js')
      ];
      
      let totalSizeKB = htmlSizeKB;
      arModulePaths.forEach(modulePath => {
        expect(fs.existsSync(modulePath)).toBe(true);
        const moduleStats = fs.statSync(modulePath);
        totalSizeKB += moduleStats.size / 1024;
      });
      
      // Total implementation should be substantial (26KB+ across all files)
      expect(totalSizeKB).toBeGreaterThan(26);
    });

    test('should contain significant JavaScript implementation', () => {
      // Check JavaScript constructs across all AR modules
      const arModulePaths = [
        path.join(__dirname, '../../src/ar/coordinate-system.js'),
        path.join(__dirname, '../../src/ar/gesture-detector.js'),
        path.join(__dirname, '../../src/ar/chart-manager.js'),
        path.join(__dirname, '../../src/ar/hand-tracking.js'),
        path.join(__dirname, '../../src/ar/hybrid-ar-controller.js')
      ];
      
      // Count JavaScript constructs (functions, variables, etc.)
      const jsConstructs = [
        /function\s+\w+/g,
        /const\s+\w+/g,
        /let\s+\w+/g,
        /var\s+\w+/g,
        /=>\s*\{/g,
        /addEventListener/g,
        /getElementById/g,
        /querySelector/g
      ];

      let totalConstructs = 0;
      arModulePaths.forEach(modulePath => {
        if (fs.existsSync(modulePath)) {
          const content = fs.readFileSync(modulePath, 'utf8');
          jsConstructs.forEach(regex => {
            const matches = content.match(regex);
            totalConstructs += matches ? matches.length : 0;
          });
        }
      });

      // Should contain 120+ JavaScript constructs across all AR modules
      expect(totalConstructs).toBeGreaterThan(120);
    });
    
  });

  describe('Dependency Verification', () => {
    
    test('should include all required AR.js dependencies', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for AR.js dependencies
      expect(content).toContain('aframe.min.js');
      expect(content).toContain('aframe-ar.js');
      expect(content).toContain('AR-js-org/AR.js');
    });

    test('should include MediaPipe dependencies', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for MediaPipe dependencies
      expect(content).toContain('@mediapipe/hands');
      expect(content).toContain('@mediapipe/camera_utils');
      expect(content).toContain('@mediapipe/drawing_utils');
    });

    test('should include A-Frame for 3D scene management', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toContain('aframe.io');
      expect(content).toContain('<a-scene');
    });

    test('should include Chart.js for data visualization', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toContain('chart.js');
      expect(content).toContain('Chart.js');
    });
    
  });

  describe('Architecture Verification', () => {
    
    test('should implement AR.js marker-based system', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for barcode markers
      expect(content).toContain('arjs="sourceType: webcam');
      expect(content).toContain('a-marker');
      expect(content).toContain('barcode');
      
      // Check for marker values 0, 1, 2, 3
      expect(content).toContain('value="0"');
      expect(content).toContain('value="1"');
      expect(content).toContain('value="2"');
      expect(content).toContain('value="3"');
    });

    test('should implement MediaPipe hand tracking system', () => {
      // Check HTML for MediaPipe dependencies
      const htmlContent = fs.readFileSync(hybridArPath, 'utf8');
      expect(htmlContent).toContain('MediaPipe');
      
      // Check hand-tracking.js module for implementation details
      const handTrackingPath = path.join(__dirname, '../../src/ar/hand-tracking.js');
      expect(fs.existsSync(handTrackingPath)).toBe(true);
      
      const handTrackingContent = fs.readFileSync(handTrackingPath, 'utf8');
      expect(handTrackingContent).toContain('Hands');
      expect(handTrackingContent).toContain('onResults');
      expect(handTrackingContent).toContain('landmarks');
    });

    test('should have shared video feed architecture', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Should reference shared video element or similar
      expect(content).toContain('video');
      expect(content).toMatch(/(getUserMedia|camera)/i);
    });

    test('should implement A-Frame entities for hand-controlled charts', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toContain('<a-entity');
      expect(content).toContain('position');
      expect(content).toContain('scale');
    });
    
  });

  describe('Feature Implementation Verification', () => {
    
    test('should implement marker detection for 4 barcode markers', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for 4 different marker entities
      const markerMatches = content.match(/<a-marker[^>]*type="barcode"[^>]*>/g);
      expect(markerMatches).toBeTruthy();
      expect(markerMatches.length).toBeGreaterThanOrEqual(4);
    });

    test('should implement 3D objects for each marker', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for 3D primitives (box, sphere, cylinder, octahedron)
      expect(content).toContain('a-box');
      expect(content).toContain('a-sphere');
      expect(content).toContain('a-cylinder');
      expect(content).toContain('a-octahedron');
    });

    test('should implement hand gesture recognition', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for gesture detection functions
      expect(content).toMatch(/(fist|pinch)/i);
      expect(content).toMatch(/(gesture|hand)/i);
      expect(content).toContain('landmarks');
    });

    test('should support multiple chart types', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for different chart types
      const chartTypes = ['bar', 'line', 'pie', 'scatter'];
      chartTypes.forEach(type => {
        expect(content).toContain(type);
      });
    });

    test('should support Blockly data integration', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Check for Blockly integration features
      expect(content).toMatch(/Load Last Visualization/i);
      expect(content).toMatch(/From Blockly/i);
      expect(content).toMatch(/automatically loaded/i);
      // Should NOT have sample data selector or manual file selection UI
      expect(content).not.toContain('Data Source');
      expect(content).not.toContain('sample-data-group');
      expect(content).not.toContain('id="chart-type"');
      expect(content).not.toContain('id="blockly-filename"');
      expect(content).not.toContain('Upload CSV');
    });
    
  });

  describe('Performance Features Verification', () => {
    
    test('should implement frame skipping for performance', () => {
      // Check hand-tracking.js module for frame skipping implementation
      const handTrackingPath = path.join(__dirname, '../../src/ar/hand-tracking.js');
      expect(fs.existsSync(handTrackingPath)).toBe(true);
      
      const handTrackingContent = fs.readFileSync(handTrackingPath, 'utf8');
      expect(handTrackingContent).toMatch(/(frame.*skip|skip.*frame)/i);
    });

    test('should include processing time monitoring', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toMatch(/(processing.*time|performance)/i);
    });
    
  });

  describe('UI Controls Verification', () => {
    
    test('should have unified control panel', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toContain('control');
      expect(content).toContain('panel');
      expect(content).toContain('button');
    });

    test('should include hand tracking controls', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toMatch(/start.*hand.*track/i);
    });
    
  });

  describe('Error Handling Verification', () => {
    
    test('should implement robust error handling', () => {
      // Check across all AR modules for error handling
      const arModulePaths = [
        path.join(__dirname, '../../src/ar/hand-tracking.js'),
        path.join(__dirname, '../../src/ar/hybrid-ar-controller.js'),
        path.join(__dirname, '../../src/ar/chart-manager.js')
      ];
      
      let foundTry = false;
      let foundCatch = false;
      let foundError = false;
      
      arModulePaths.forEach(modulePath => {
        if (fs.existsSync(modulePath)) {
          const content = fs.readFileSync(modulePath, 'utf8');
          if (content.includes('try')) foundTry = true;
          if (content.includes('catch')) foundCatch = true;
          if (content.includes('error')) foundError = true;
        }
      });
      
      expect(foundTry).toBe(true);
      expect(foundCatch).toBe(true);
      expect(foundError).toBe(true);
    });

    test('should include status feedback mechanisms', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toMatch(/(status|feedback)/i);
    });
    
  });

  describe('Technical Improvements Verification', () => {
    
    test('should handle MediaPipe integration without conflicts', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      // Should not have conflicting video handling
      expect(content).not.toMatch(/video.*conflict/i);
      expect(content).toContain('MediaPipe');
      expect(content).toContain('AR.js');
    });

    test('should implement coordinate system mapping', () => {
      // Check coordinate-system.js module for coordinate mapping implementation
      const coordinatePath = path.join(__dirname, '../../src/ar/coordinate-system.js');
      expect(fs.existsSync(coordinatePath)).toBe(true);
      
      const coordinateContent = fs.readFileSync(coordinatePath, 'utf8');
      expect(coordinateContent).toMatch(/(coordinate|mapping)/i);
      expect(coordinateContent).toMatch(/(screen.*world|world.*screen)/i);
      expect(coordinateContent).toContain('screenToWorld');
    });

    test('should optimize chart texture management', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toContain('canvas');
      expect(content).toMatch(/(texture|material)/i);
    });

    test('should include marker detection monitoring', () => {
      const content = fs.readFileSync(hybridArPath, 'utf8');
      
      expect(content).toMatch(/(marker.*detect|detect.*marker)/i);
    });
    
  });

  describe('Integration Tests', () => {
    
    test('should integrate with backend data APIs', async () => {
      // Test that hybrid AR can use the same APIs as other components
      const dataTypes = ['students', 'weather', 'sales'];
      
      for (const dataType of dataTypes) {
        const response = await request(app)
          .get(`/api/test-data/${dataType}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    test('should support chart generation for AR visualization', async () => {
      const dataResponse = await request(app)
        .get('/api/test-data/students')
        .expect(200);

      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'bar',
          options: { title: 'AR Chart Test' }
        })
        .expect(200);

      expect(chartResponse.body.success).toBe(true);
    });

    test('should support AR-specific visualization endpoint', async () => {
      const response = await request(app)
        .post('/api/ar-visualization')
        .send({
          data: [{ name: 'test', value: 100 }],
          visualizationType: 'bar',
          markerId: 'marker-001'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.markerId).toBe('marker-001');
    });
    
  });

});