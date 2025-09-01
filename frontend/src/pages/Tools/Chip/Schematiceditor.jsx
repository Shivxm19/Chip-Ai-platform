// src/pages/Tools/Chip/ProfessionalSchematicEditor.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  FaSave, FaDownload, FaUpload, FaLightbulb, FaExclamationTriangle, 
  FaChevronLeft, FaBars, FaPlus, FaTimes, FaExpand, FaCompress,
  FaSearch, FaProjectDiagram, FaCode, FaSitemap, FaCog, FaUserCircle,
  FaBell, FaQuestionCircle, FaShareAlt, FaHistory, FaCloudUploadAlt,
  FaMousePointer, FaPen, FaTrash, FaUndo, FaRedo, FaSlidersH, FaEye
} from 'react-icons/fa';

const ProfessionalSchematicEditor = () => {
  const canvasRef = useRef(null);
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedWire, setSelectedWire] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wireStart, setWireStart] = useState(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState('dark');
  const [activeTool, setActiveTool] = useState('select');
  const [showProperties, setShowProperties] = useState(true);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [gridSize, setGridSize] = useState(10);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Component library
  const componentLibrary = [
    { type: 'AND', label: 'AND Gate', symbol: '&', pins: [{x: 0, y: 15, type: 'input'}, {x: 0, y: 35, type: 'input'}, {x: 60, y: 25, type: 'output'}] },
    { type: 'OR', label: 'OR Gate', symbol: '≥1', pins: [{x: 0, y: 15, type: 'input'}, {x: 0, y: 35, type: 'input'}, {x: 60, y: 25, type: 'output'}] },
    { type: 'XOR', label: 'XOR Gate', symbol: '=1', pins: [{x: 0, y: 15, type: 'input'}, {x: 0, y: 35, type: 'input'}, {x: 60, y: 25, type: 'output'}] },
    { type: 'NOT', label: 'NOT Gate', symbol: '1', pins: [{x: 0, y: 25, type: 'input'}, {x: 60, y: 25, type: 'output'}] },
    { type: 'NAND', label: 'NAND Gate', symbol: '&', pins: [{x: 0, y: 15, type: 'input'}, {x: 0, y: 35, type: 'input'}, {x: 60, y: 25, type: 'output'}] },
    { type: 'FLIPFLOP', label: 'D Flip-Flop', symbol: 'DFF', pins: [
      {x: 0, y: 10, type: 'input', label: 'D'}, 
      {x: 0, y: 25, type: 'input', label: 'CLK'}, 
      {x: 0, y: 40, type: 'input', label: 'RST'},
      {x: 60, y: 15, type: 'output', label: 'Q'}, 
      {x: 60, y: 35, type: 'output', label: 'Q̅'}
    ]},
    { type: 'ALU', label: 'ALU', symbol: 'ALU', pins: [
      {x: 0, y: 10, type: 'input', label: 'A'}, 
      {x: 0, y: 25, type: 'input', label: 'B'}, 
      {x: 0, y: 40, type: 'input', label: 'OP'},
      {x: 0, y: 55, type: 'input', label: 'CI'},
      {x: 60, y: 15, type: 'output', label: 'R'}, 
      {x: 60, y: 35, type: 'output', label: 'CO'}, 
      {x: 60, y: 50, type: 'output', label: 'Z'}
    ]},
    { type: 'MEMORY', label: 'Memory Block', symbol: 'RAM', pins: [
      {x: 0, y: 10, type: 'input', label: 'ADDR'}, 
      {x: 0, y: 25, type: 'input', label: 'DATA_IN'}, 
      {x: 0, y: 40, type: 'input', label: 'WE'},
      {x: 0, y: 55, type: 'input', label: 'CS'},
      {x: 60, y: 15, type: 'output', label: 'DATA_OUT'}, 
      {x: 60, y: 35, type: 'output', label: 'READY'}
    ]},
  ];

  // Save current state to history
  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      components: JSON.parse(JSON.stringify(components)),
      wires: JSON.parse(JSON.stringify(wires))
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo action
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setComponents(JSON.parse(JSON.stringify(history[newIndex].components)));
      setWires(JSON.parse(JSON.stringify(history[newIndex].wires)));
    }
  };

  // Redo action
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setComponents(JSON.parse(JSON.stringify(history[newIndex].components)));
      setWires(JSON.parse(JSON.stringify(history[newIndex].wires)));
    }
  };

  // Add a new component to the canvas
  const addComponent = (type, x, y) => {
    const comp = componentLibrary.find(c => c.type === type);
    if (comp) {
      const newComponent = {
        id: `comp_${Date.now()}`,
        type,
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: 60,
        height: 50,
        rotation: 0,
        pins: [...comp.pins],
        label: comp.label,
        symbol: comp.symbol
      };
      
      saveToHistory();
      setComponents([...components, newComponent]);
      checkAiSuggestions([...components, newComponent], wires);
    }
  };

  // Delete selected component or wire
  const deleteSelected = () => {
    if (selectedComponent) {
      saveToHistory();
      // Remove wires connected to this component
      const updatedWires = wires.filter(wire => 
        wire.startComp !== selectedComponent.id && wire.endComp !== selectedComponent.id
      );
      setWires(updatedWires);
      setComponents(components.filter(comp => comp.id !== selectedComponent.id));
      setSelectedComponent(null);
      checkAiSuggestions(
        components.filter(comp => comp.id !== selectedComponent.id), 
        updatedWires
      );
    } else if (selectedWire) {
      saveToHistory();
      setWires(wires.filter(wire => wire.id !== selectedWire.id));
      setSelectedWire(null);
      checkAiSuggestions(components, wires.filter(wire => wire.id !== selectedWire.id));
    }
  };

  // Handle mouse down on canvas
  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === 'select') {
      // Check if clicked on a component
      const clickedComponent = components.find(comp => 
        x >= comp.x && x <= comp.x + comp.width && 
        y >= comp.y && y <= comp.y + comp.height
      );
      
      if (clickedComponent) {
        handleMouseDown(e, clickedComponent);
        return;
      }
      
      // Check if clicked on a wire
      const clickedWire = wires.find(wire => {
        // Simple distance to line segment calculation
        const dx = wire.endX - wire.startX;
        const dy = wire.endY - wire.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const dot = ((x - wire.startX) * dx + (y - wire.startY) * dy) / (length * length);
        const closestX = wire.startX + dot * dx;
        const closestY = wire.startY + dot * dy;
        
        const distance = Math.sqrt(Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2));
        return distance < 5 && dot >= 0 && dot <= 1;
      });
      
      if (clickedWire) {
        setSelectedWire(clickedWire);
        setSelectedComponent(null);
      } else {
        setSelectedComponent(null);
        setSelectedWire(null);
      }
    } else if (activeTool === 'wire' && !wireStart) {
      // Start drawing a wire from canvas point
      setWireStart({ x, y, component: null, pinIndex: null });
    }
  };

  // Handle mouse down on component
  const handleMouseDown = (e, component) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;
    
    setSelectedComponent(component);
    setSelectedWire(null);
    setDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - component.x,
      y: e.clientY - rect.top - component.y
    });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (dragging && selectedComponent && activeTool === 'select') {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left - dragOffset.x;
      let y = e.clientY - rect.top - dragOffset.y;
      
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      
      const updatedComponents = components.map(comp => 
        comp.id === selectedComponent.id ? { ...comp, x, y } : comp
      );
      
      setComponents(updatedComponents);
      setSelectedComponent({ ...selectedComponent, x, y });
      
      // Update wires connected to this component
      const updatedWires = wires.map(wire => {
        if (wire.startComp === selectedComponent.id) {
          const pin = selectedComponent.pins[wire.startPin];
          return { ...wire, startX: x + pin.x, startY: y + pin.y };
        }
        if (wire.endComp === selectedComponent.id) {
          const pin = selectedComponent.pins[wire.endPin];
          return { ...wire, endX: x + pin.x, endY: y + pin.y };
        }
        return wire;
      });
      
      setWires(updatedWires);
      checkAiSuggestions(updatedComponents, updatedWires);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
      saveToHistory();
    }
  };

  // Handle pin click for wiring
  const handlePinClick = (e, component, pinIndex, pin) => {
    e.stopPropagation();
    if (activeTool !== 'wire') return;
    
    if (wireStart) {
      // Complete the wire
      if (wireStart.component?.id !== component.id || wireStart.pinIndex !== pinIndex) {
        const newWire = {
          id: `wire_${Date.now()}`,
          startComp: wireStart.component?.id || null,
          startPin: wireStart.pinIndex,
          startX: wireStart.component ? wireStart.component.x + wireStart.pin.x : wireStart.x,
          startY: wireStart.component ? wireStart.component.y + wireStart.pin.y : wireStart.y,
          endComp: component.id,
          endPin: pinIndex,
          endX: component.x + pin.x,
          endY: component.y + pin.y
        };
        
        saveToHistory();
        setWires([...wires, newWire]);
        checkAiSuggestions(components, [...wires, newWire]);
      }
      setWireStart(null);
      setActiveTool('select');
    } else {
      // Start a new wire
      setWireStart({
        component,
        pinIndex,
        pin,
        x: component.x + pin.x,
        y: component.y + pin.y
      });
    }
  };

  // AI suggestions for errors and improvements
  const checkAiSuggestions = (comps, wireList) => {
    const suggestions = [];
    
    // Check for floating inputs
    comps.forEach(comp => {
      comp.pins.forEach((pin, pinIndex) => {
        if (pin.type === 'input') {
          const isConnected = wireList.some(wire => 
            wire.endComp === comp.id && wire.endPin === pinIndex
          );
          if (!isConnected) {
            suggestions.push({
              type: 'error',
              message: `Floating input on ${comp.type} gate (${pin.label || `pin ${pinIndex}`})`,
              component: comp.id,
              pin: pinIndex
            });
          }
        }
      });
    });
    
    // Check for short circuits (wires with same start and end)
    wireList.forEach(wire => {
      if (wire.startComp === wire.endComp && wire.startPin === wire.endPin) {
        suggestions.push({
          type: 'error',
          message: `Short circuit detected on ${comps.find(c => c.id === wire.startComp)?.type || 'component'}`,
          component: wire.startComp,
          pin: wire.startPin
        });
      }
    });
    
    // Check for output-to-output connections
    wireList.forEach(wire => {
      const startComp = comps.find(c => c.id === wire.startComp);
      const endComp = comps.find(c => c.id === wire.endComp);
      
      if (startComp && endComp) {
        const startPin = startComp.pins[wire.startPin];
        const endPin = endComp.pins[wire.endPin];
        
        if (startPin && endPin && startPin.type === 'output' && endPin.type === 'output') {
          suggestions.push({
            type: 'warning',
            message: `Output-to-output connection between ${startComp.type} and ${endComp.type}`,
            component: wire.startComp,
            pin: wire.startPin
          });
        }
      }
    });
    
    // Check for complex circuits that could be simplified
    if (comps.length >= 5 && wireList.length >= 8) {
      suggestions.push({
        type: 'suggestion',
        message: "Consider creating a custom component from this circuit to simplify your design",
        component: null,
        pin: null
      });
    }
    
    setAiSuggestions(suggestions);
  };

  // Zoom in
  const zoomIn = () => {
    setZoom(Math.min(200, zoom + 10));
  };

  // Zoom out
  const zoomOut = () => {
    setZoom(Math.max(50, zoom - 10));
  };

  // Reset zoom
  const resetZoom = () => {
    setZoom(100);
  };

  // Export schematic as JSON
  const exportSchematic = () => {
    const data = {
      components,
      wires,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'schematic.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import schematic from JSON
  const importSchematic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.components && data.wires) {
          saveToHistory();
          setComponents(data.components);
          setWires(data.wires);
          checkAiSuggestions(data.components, data.wires);
        }
      } catch (error) {
        console.error('Error parsing schematic file:', error);
        alert('Invalid schematic file format');
      }
    };
    reader.readAsText(file);
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          exportSchematic();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponent, selectedWire, components, wires, history, historyIndex]);

  // Draw the schematic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = theme === 'dark' ? '#2a2a3a' : '#e0e0e0';
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    
    // Draw wires
    wires.forEach(wire => {
      ctx.beginPath();
      ctx.moveTo(wire.startX, wire.startY);
      ctx.lineTo(wire.endX, wire.endY);
      ctx.strokeStyle = wire.id === selectedWire?.id ? '#4f8cff' : '#ccc';
      ctx.lineWidth = wire.id === selectedWire?.id ? 3 : 2;
      ctx.stroke();
      
      // Draw connection points
      ctx.beginPath();
      ctx.arc(wire.startX, wire.startY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#888';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(wire.endX, wire.endY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#888';
      ctx.fill();
    });
    
    // Draw wire in progress
    if (wireStart) {
      ctx.beginPath();
      ctx.moveTo(wireStart.x, wireStart.y);
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(
        (window.event.clientX - rect.left) * (zoom / 100),
        (window.event.clientY - rect.top) * (zoom / 100)
      );
      ctx.strokeStyle = '#4f8cff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw components
    components.forEach(component => {
      const isSelected = component.id === selectedComponent?.id;
      
      // Component body
      ctx.fillStyle = theme === 'dark' ? (isSelected ? '#3a4a6a' : '#2a2a3a') : (isSelected ? '#e0e8ff' : '#fff');
      ctx.strokeStyle = isSelected ? '#4f8cff' : '#666';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillRect(component.x, component.y, component.width, component.height);
      ctx.strokeRect(component.x, component.y, component.width, component.height);
      
      // Component symbol
      ctx.fillStyle = theme === 'dark' ? '#fff' : '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        component.symbol, 
        component.x + component.width / 2, 
        component.y + component.height / 2
      );
      
      // Component label
      ctx.font = '10px Arial';
      ctx.fillText(
        component.label, 
        component.x + component.width / 2, 
        component.y + component.height + 15
      );
      
      // Pins
      component.pins.forEach((pin, index) => {
        const pinX = component.x + pin.x;
        const pinY = component.y + pin.y;
        
        // Pin circle
        ctx.beginPath();
        ctx.arc(pinX, pinY, 4, 0, Math.PI * 2);
        ctx.fillStyle = pin.type === 'input' ? '#6f6' : '#f66';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Pin label
        if (pin.label) {
          ctx.fillStyle = theme === 'dark' ? '#ccc' : '#666';
          ctx.font = '10px Arial';
          ctx.textAlign = pin.type === 'input' ? 'left' : 'right';
          ctx.fillText(
            pin.label, 
            pinX + (pin.type === 'input' ? -10 : 10), 
            pinY
          );
        }
      });
    });
  }, [components, wires, selectedComponent, selectedWire, wireStart, zoom, theme, gridSize, showGrid]);

  return (
    <div className={`schematic-editor ${theme}-theme`}>
      {/* Top toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" title="Back">
            <FaChevronLeft />
          </button>
          <h2>Schematic Editor</h2>
        </div>
        
        <div className="toolbar-center">
          <button 
            className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setActiveTool('select')}
            title="Select Tool"
          >
            <FaMousePointer />
          </button>
          <button 
            className={`toolbar-btn ${activeTool === 'wire' ? 'active' : ''}`}
            onClick={() => setActiveTool('wire')}
            title="Wire Tool"
          >
            <FaPen />
          </button>
          <button className="toolbar-btn" onClick={undo} title="Undo" disabled={historyIndex <= 0}>
            <FaUndo />
          </button>
          <button className="toolbar-btn" onClick={redo} title="Redo" disabled={historyIndex >= history.length - 1}>
            <FaRedo />
          </button>
          <button className="toolbar-btn" onClick={deleteSelected} title="Delete" disabled={!selectedComponent && !selectedWire}>
            <FaTrash />
          </button>
          
          <div className="toolbar-divider"></div>
          
          <button className="toolbar-btn" onClick={zoomOut} title="Zoom Out">
            <FaSearch className="rotate-45" />
          </button>
          <span className="zoom-level">{zoom}%</span>
          <button className="toolbar-btn" onClick={zoomIn} title="Zoom In">
            <FaSearch className="rotate-135" />
          </button>
          <button className="toolbar-btn" onClick={resetZoom} title="Reset Zoom">
            <FaExpand />
          </button>
        </div>
        
        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={exportSchematic} title="Export">
            <FaDownload />
          </button>
          <label htmlFor="import-schematic" className="toolbar-btn" title="Import">
            <FaUpload />
            <input
              id="import-schematic"
              type="file"
              accept=".json"
              onChange={importSchematic}
              style={{ display: 'none' }}
            />
          </label>
          <button className="toolbar-btn" title="Save">
            <FaSave />
          </button>
          <button className="toolbar-btn" title="Settings">
            <FaCog />
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        {/* Left sidebar - Component library */}
        {showComponentLibrary && (
          <div className="sidebar left-sidebar">
            <div className="sidebar-header">
              <h3>Components</h3>
              <button className="sidebar-toggle" onClick={() => setShowComponentLibrary(false)}>
                <FaChevronLeft />
              </button>
            </div>
            
            <div className="component-library">
              {componentLibrary.map(comp => (
                <div
                  key={comp.type}
                  className="component-item"
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('componentType', comp.type);
                  }}
                  onClick={() => {
                    const rect = canvasRef.current.getBoundingClientRect();
                    addComponent(
                      comp.type, 
                      rect.width / 2 - 30, 
                      rect.height / 2 - 25
                    );
                  }}
                >
                  <div className="component-preview">
                    <div className="component-symbol">{comp.symbol}</div>
                  </div>
                  <span className="component-label">{comp.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!showComponentLibrary && (
          <button className="sidebar-toggle-floating" onClick={() => setShowComponentLibrary(true)}>
            <FaChevronLeft className="rotate-180" />
          </button>
        )}
        
        {/* Main canvas area */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const componentType = e.dataTransfer.getData('componentType');
              if (componentType) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (100 / zoom);
                const y = (e.clientY - rect.top) * (100 / zoom);
                addComponent(componentType, x, y);
              }
            }}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: '0 0',
              cursor: activeTool === 'wire' ? 'crosshair' : dragging ? 'grabbing' : 'default'
            }}
          />
        </div>
        
        {/* Right sidebar - Properties and AI suggestions */}
        <div className="sidebar right-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`tab-btn ${showProperties ? 'active' : ''}`}
              onClick={() => setShowProperties(true)}
            >
              <FaSlidersH /> Properties
            </button>
            <button 
              className={`tab-btn ${!showProperties ? 'active' : ''}`}
              onClick={() => setShowProperties(false)}
            >
              <FaLightbulb /> AI Assistant
            </button>
          </div>
          
          <div className="sidebar-content">
            {showProperties ? (
              <div className="properties-panel">
                {selectedComponent ? (
                  <>
                    <h4>Component Properties</h4>
                    <div className="property-group">
                      <label>Type</label>
                      <span>{selectedComponent.type}</span>
                    </div>
                    <div className="property-group">
                      <label>Position</label>
                      <div className="position-inputs">
                        <input 
                          type="number" 
                          value={selectedComponent.x} 
                          onChange={e => {
                            const x = parseInt(e.target.value);
                            const updatedComponents = components.map(comp => 
                              comp.id === selectedComponent.id ? { ...comp, x } : comp
                            );
                            setComponents(updatedComponents);
                            setSelectedComponent({ ...selectedComponent, x });
                          }}
                        />
                        <input 
                          type="number" 
                          value={selectedComponent.y} 
                          onChange={e => {
                            const y = parseInt(e.target.value);
                            const updatedComponents = components.map(comp => 
                              comp.id === selectedComponent.id ? { ...comp, y } : comp
                            );
                            setComponents(updatedComponents);
                            setSelectedComponent({ ...selectedComponent, y });
                          }}
                        />
                      </div>
                    </div>
                    <div className="property-group">
                      <label>Rotation</label>
                      <select 
                        value={selectedComponent.rotation}
                        onChange={e => {
                          const rotation = parseInt(e.target.value);
                          const updatedComponents = components.map(comp => 
                            comp.id === selectedComponent.id ? { ...comp, rotation } : comp
                          );
                          setComponents(updatedComponents);
                          setSelectedComponent({ ...selectedComponent, rotation });
                        }}
                      >
                        <option value={0}>0°</option>
                        <option value={90}>90°</option>
                        <option value={180}>180°</option>
                        <option value={270}>270°</option>
                      </select>
                    </div>
                  </>
                ) : selectedWire ? (
                  <>
                    <h4>Wire Properties</h4>
                    <div className="property-group">
                      <label>Length</label>
                      <span>
                        {Math.sqrt(
                          Math.pow(selectedWire.endX - selectedWire.startX, 2) + 
                          Math.pow(selectedWire.endY - selectedWire.startY, 2)
                        ).toFixed(1)} px
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="no-selection">
                    <FaMousePointer size={24} />
                    <p>Select a component or wire to view properties</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-panel">
                <div className="ai-header">
                  <h4>
                    <FaLightbulb /> AI Assistant
                  </h4>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={showAiSuggestions}
                      onChange={() => setShowAiSuggestions(!showAiSuggestions)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                {showAiSuggestions ? (
                  <div className="suggestions-list">
                    {aiSuggestions.length > 0 ? (
                      aiSuggestions.map((suggestion, index) => (
                        <div key={index} className={`suggestion-item ${suggestion.type}`}>
                          <div className="suggestion-icon">
                            {suggestion.type === 'error' ? (
                              <FaExclamationTriangle />
                            ) : suggestion.type === 'warning' ? (
                              <FaExclamationTriangle />
                            ) : (
                              <FaLightbulb />
                            )}
                          </div>
                          <div className="suggestion-content">
                            <p>{suggestion.message}</p>
                            {suggestion.component && (
                              <button 
                                className="suggestion-action"
                                onClick={() => {
                                  const comp = components.find(c => c.id === suggestion.component);
                                  if (comp) {
                                    setSelectedComponent(comp);
                                    setSelectedWire(null);
                                  }
                                }}
                              >
                                Show
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-suggestions">
                        <FaBell size={20} />
                        <p>No issues detected</p>
                        <small>Your schematic looks good!</small>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ai-disabled">
                    <FaEye size={24} />
                    <p>AI suggestions are disabled</p>
                    <button 
                      className="enable-ai-btn"
                      onClick={() => setShowAiSuggestions(true)}
                    >
                      Enable AI Assistant
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>
            Components: {components.length} | Wires: {wires.length}
          </span>
        </div>
        <div className="status-center">
          {wireStart && <span>Drawing wire - Click to complete</span>}
          {dragging && <span>Dragging {selectedComponent?.type}</span>}
        </div>
        <div className="status-right">
          <label className="grid-toggle">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={() => setShowGrid(!showGrid)}
            />
            Show Grid
          </label>
          <label className="snap-toggle">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={() => setSnapToGrid(!snapToGrid)}
            />
            Snap to Grid
          </label>
        </div>
      </div>
      
      <style jsx>{`
        .schematic-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #1a1a2a;
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .dark-theme {
          background: #1a1a2a;
          color: #fff;
        }
        
        .light-theme {
          background: #f5f5f5;
          color: #333;
        }
        
        .editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #2a2a3a;
          border-bottom: 1px solid #3a3a4a;
        }
        
        .toolbar-left, .toolbar-center, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .toolbar-center {
          flex: 1;
          justify-content: center;
        }
        
        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #ccc;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toolbar-btn:hover {
          background: #3a3a4a;
          color: #fff;
        }
        
        .toolbar-btn.active {
          background: #4f8cff;
          color: #fff;
        }
        
        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .toolbar-btn:disabled:hover {
          background: transparent;
          color: #ccc;
        }
        
        .toolbar-divider {
          width: 1px;
          height: 1.5rem;
          background: #3a3a4a;
          margin: 0 0.5rem;
        }
        
        .zoom-level {
          padding: 0 0.5rem;
          font-size: 0.9rem;
        }
        
        .editor-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .sidebar {
          width: 280px;
          background: #2a2a3a;
          border-right: 1px solid #3a3a4a;
          display: flex;
          flex-direction: column;
        }
        
        .right-sidebar {
          border-right: none;
          border-left: 1px solid #3a3a4a;
        }
        
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #3a3a4a;
        }
        
        .sidebar-toggle {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          padding: 0.25rem;
        }
        
        .sidebar-toggle:hover {
          color: #fff;
        }
        
        .sidebar-toggle-floating {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          background: #2a2a3a;
          border: 1px solid #3a3a4a;
          border-left: none;
          border-radius: 0 4px 4px 0;
          color: #ccc;
          padding: 0.5rem;
          cursor: pointer;
          z-index: 10;
        }
        
        .sidebar-toggle-floating:hover {
          background: #3a3a4a;
          color: #fff;
        }
        
        .rotate-45 {
          transform: rotate(45deg);
        }
        
        .rotate-135 {
          transform: rotate(135deg);
        }
        
        .rotate-180 {
          transform: rotate(180deg);
        }
        
        .component-library {
          padding: 1rem;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          overflow-y: auto;
        }
        
        .component-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          background: #3a3a4a;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .component-item:hover {
          background: #4a4a5a;
          transform: translateY(-2px);
        }
        
        .component-preview {
          width: 50px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2a2a3a;
          border: 1px solid #4a4a5a;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        
        .component-symbol {
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .component-label {
          font-size: 0.8rem;
          text-align: center;
        }
        
        .canvas-container {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a2a;
          background-image: 
            linear-gradient(45deg, #2a2a3a 25%, transparent 25%), 
            linear-gradient(-45deg, #2a2a3a 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #2a2a3a 75%), 
            linear-gradient(-45deg, transparent 75%, #2a2a3a 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        
        canvas {
          background: #1a1a2a;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid #3a3a4a;
        }
        
        .tab-btn {
          flex: 1;
          padding: 0.75rem;
          background: #2a2a3a;
          border: none;
          color: #ccc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        
        .tab-btn.active {
          background: #3a3a4a;
          color: #fff;
          border-bottom: 2px solid #4f8cff;
        }
        
        .sidebar-content {
          flex: 1;
          overflow-y: auto;
        }
        
        .properties-panel, .ai-panel {
          padding: 1rem;
        }
        
        .property-group {
          margin-bottom: 1rem;
        }
        
        .property-group label {
          display: block;
          font-size: 0.8rem;
          color: #aaa;
          margin-bottom: 0.25rem;
        }
        
        .property-group span {
          display: block;
          font-size: 0.9rem;
        }
        
        .property-group input, .property-group select {
          width: 100%;
          padding: 0.5rem;
          background: #3a3a4a;
          border: 1px solid #4a4a5a;
          border-radius: 4px;
          color: #fff;
        }
        
        .position-inputs {
          display: flex;
          gap: 0.5rem;
        }
        
        .position-inputs input {
          flex: 1;
        }
        
        .no-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          text-align: center;
        }
        
        .no-selection p {
          margin-top: 0.5rem;
        }
        
        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #3a3a4a;
          transition: .4s;
          border-radius: 20px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: #4f8cff;
        }
        
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        
        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .suggestion-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #3a3a4a;
          border-radius: 6px;
          border-left: 4px solid #4f8cff;
        }
        
        .suggestion-item.error {
          border-left-color: #ff4f4f;
        }
        
        .suggestion-item.warning {
          border-left-color: #ffb84f;
        }
        
        .suggestion-icon {
          font-size: 1rem;
          color: #4f8cff;
        }
        
        .suggestion-item.error .suggestion-icon {
          color: #ff4f4f;
        }
        
        .suggestion-item.warning .suggestion-icon {
          color: #ffb84f;
        }
        
        .suggestion-content {
          flex: 1;
        }
        
        .suggestion-content p {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .suggestion-action {
          background: #4a4a5a;
          border: none;
          border-radius: 4px;
          color: #ccc;
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          cursor: pointer;
        }
        
        .suggestion-action:hover {
          background: #5a5a6a;
          color: #fff;
        }
        
        .no-suggestions, .ai-disabled {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          text-align: center;
        }
        
        .no-suggestions small, .ai-disabled p {
          margin-top: 0.5rem;
        }
        
        .enable-ai-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #4f8cff;
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
        }
        
        .enable-ai-btn:hover {
          background: #3a7cff;
        }
        
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #2a2a3a;
          border-top: 1px solid #3a3a4a;
          font-size: 0.8rem;
          color: #aaa;
        }
        
        .status-left, .status-center, .status-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .grid-toggle, .snap-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .grid-toggle input, .snap-toggle input {
          margin: 0;
        }
        
        @media (max-width: 1200px) {
          .sidebar {
            width: 240px;
          }
        }
        
        @media (max-width: 992px) {
          .sidebar {
            width: 200px;
          }
          
          .component-library {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .editor-content {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            height: 200px;
            border-right: none;
            border-bottom: 1px solid #3a3a4a;
          }
          
          .right-sidebar {
            border-left: none;
            border-top: 1px solid #3a3a4a;
          }
          
          .canvas-container {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalSchematicEditor;