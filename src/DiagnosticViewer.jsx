import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import OdontogramEditor from './OdontogramEditor';
import OralHealthReport from './OralHealthReport';

export default function DiagnosticViewer({ sharedData, patient, onSaveRecord }) {
  const mountRef = useRef(null);
  const [arch, setArch] = useState('upper');
  const [displayMode, setDisplayMode] = useState('both');
  const [openMouth, setOpenMouth] = useState(0);
  const [viewMode, setViewMode] = useState('3d');
  const [filters, setFilters] = useState({
    toothNumber: true,
    earlyCaries: true,
    advancedCaries: false,
    calculus: true
  });
  const [findings, setFindings] = useState({});
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMasks, setAiMasks] = useState({ upper: [], lower: [] });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [activeView, setActiveView] = useState('');
  const zipInputRef = useRef(null);
  const [hasRunAI, setHasRunAI] = useState(false);

  // processAIDetections is now unused because we aggregate inside handleRunAI
  const processAIDetections = (data, allDetectedTeeth, newFindings) => {
    // legacy
  };

  useEffect(() => {
    if (sharedData) {
       setHasRunAI(false);
       setAiMasks({ upper: [], lower: [] });
    }
  }, [sharedData]);

  useEffect(() => {
    if (sharedData && !hasRunAI && !isAnalyzing) {
      handleRunAI();
    }
  }, [sharedData, hasRunAI, isAnalyzing]);

  const handleSaveRecord = async (editorRecord) => {
    try {
       const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
       
       // Convert findings object into array format for API
       const formattedFindings = Object.keys(findings).map(toothNum => ({
          tooth_number: parseInt(toothNum),
          conditions: findings[toothNum].conditions.join(','),
          note: findings[toothNum].note || ''
       }));

       const payload = {
          patient_id: parseInt(patient.id) || 1, // fallback to 1 if no patient id
          zip_url: sharedData?.zip_url || null,
          dentist_name: "Dr. Admin", // Hardcoded for now
          findings: formattedFindings
       };

       const response = await fetch(`${apiUrl}/api/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
       });

       if (response.ok) {
          const savedData = await response.json();
          if (onSaveRecord) {
             onSaveRecord(savedData); // Pass back to App.jsx to change tab
          }
       } else {
          const err = await response.json();
          alert("Error saving record: " + err.detail);
       }
    } catch (err) {
       console.error("Failed to save record:", err);
       alert("Cannot connect to Database Server to save record.");
    }
  };

  const handleRunAI = async () => {
    if (!sharedData || !sharedData[arch] || !sharedData[arch].images.length) return;
    
    setIsAnalyzing(true);
    try {
      const newFindings = { ...findings };
      const allDetectedTeeth = new Set();
      // Track best confidence for each tooth
      const bestDetections = {}; 
      
      const archesToProcess = ['upper', 'lower'];
      
      for (const currentArch of archesToProcess) {
        if (!sharedData[currentArch] || !sharedData[currentArch].images) continue;
        
        for (const img of sharedData[currentArch].images) {
          // Send ALL views to AI as requested by user to improve detection
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: img.url })
          });
          
          if (!response.ok) {
             const errText = await response.text();
             console.error("AI Server returned an error", errText);
             throw new Error("AI Server Error: " + errText);
          }
          
          const data = await response.json();
          
          if (data.mask_base64) {
             setAiMasks(prev => ({
                ...prev,
                [currentArch]: [...prev[currentArch], {
                   url: 'data:image/jpeg;base64,' + data.mask_base64,
                   name: img.name
                }]
             }));
          }
          
          data.detections.forEach(det => {
             const cls = det.class_name.toString();
             const conf = det.confidence;
             const toothMatch = cls.match(/(1[1-8]|2[1-8]|3[1-8]|4[1-8]|5[1-5]|6[1-5]|7[1-5]|8[1-5])/);
             
             if (toothMatch) {
                const toothNum = parseInt(toothMatch[0]);
                
                // If duplicate, keep highest confidence
                if (!bestDetections[toothNum] || conf > bestDetections[toothNum].confidence) {
                   bestDetections[toothNum] = {
                      cls: cls,
                      confidence: conf
                   };
                }
             }
          });
        }
      }
      
      // Now apply the best detections to findings
      Object.keys(bestDetections).forEach(tNum => {
         const toothNum = parseInt(tNum);
         const det = bestDetections[toothNum];
         allDetectedTeeth.add(toothNum);
         
         let condition = 'Healthy';
         const lowerCls = det.cls.toLowerCase();
         if (lowerCls.includes('caries')) condition = 'Caries-Superficial';
         if (lowerCls.includes('deep')) condition = 'Caries-Deep';
         if (lowerCls.includes('filling')) condition = 'Filling';
         if (lowerCls.includes('calculus')) condition = 'Calculus';
         if (lowerCls.includes('missing')) condition = 'Missing';
         
         if (!newFindings[toothNum]) {
           newFindings[toothNum] = { conditions: [], note: '' };
         }
         if (!newFindings[toothNum].conditions.includes(condition)) {
           newFindings[toothNum].conditions.push(condition);
         }
         
         // Replace note with highest confidence
         const cleanNote = newFindings[toothNum].note.replace(/\[AI:.*?\]/g, '').trim();
         const noteAddition = `[AI: ${det.cls} (${(det.confidence*100).toFixed(0)}%)]`;
         newFindings[toothNum].note = (cleanNote + " " + noteAddition).trim();
      });

      // Mark undetected teeth as 'Missing'
      const ALL_TEETH = [
        18,17,16,15,14,13,12,11,
        21,22,23,24,25,26,27,28,
        41,42,43,44,45,46,47,48,
        31,32,33,34,35,36,37,38
      ];
      
      ALL_TEETH.forEach(toothNum => {
        // If AI didn't detect this tooth at all in any image, mark it as missing
        if (!allDetectedTeeth.has(toothNum)) {
          if (!newFindings[toothNum]) {
             newFindings[toothNum] = { conditions: [], note: '' };
          }
          if (!newFindings[toothNum].conditions.includes('Missing')) {
             newFindings[toothNum].conditions.push('Missing');
             newFindings[toothNum].note = (newFindings[toothNum].note + " [AI: Not Detected]").trim();
          }
        }
      });
      
      setFindings(newFindings);
      // alert('AI Diagnostics ประมวลผลเสร็จสิ้น!'); // Remove alert for auto-run
      
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อ AI Server ได้ (กรุณารัน Python ที่พอร์ต 8000)');
    } finally {
      setIsAnalyzing(false);
      setHasRunAI(true);
    }
  };
  
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const objectGroupRef = useRef(new THREE.Group());
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (viewMode !== '3d' || !mountRef.current || showReport) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F5F5F7');
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    camera.position.set(0, -100, 100);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 50, 50);
    scene.add(dirLight);

    scene.add(objectGroupRef.current);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [viewMode, showReport]);

  // Update autoRotate when state changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [isAutoRotating]);

  // Handle resize when fullscreen toggles
  useEffect(() => {
    if (mountRef.current && cameraRef.current && rendererRef.current) {
      // Need a small timeout to allow CSS to apply before measuring
      setTimeout(() => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }, 50);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (viewMode !== '3d' || !sharedData || showReport) return;
    
    objectGroupRef.current.clear();

    const loadArch = (archName) => {
      const data = sharedData[archName];
      if (!data || !data.objData) return null;

      const manager = new THREE.LoadingManager();
      if (sharedData && sharedData.assetMap) {
        manager.setURLModifier((url) => {
          const nameOnly = url.split('/').pop().toLowerCase();
          if (sharedData.assetMap[nameOnly]) return sharedData.assetMap[nameOnly];
          return url;
        });
      }

      const objLoader = new OBJLoader(manager);
      let hasMaterials = false;
      
      if (data.mtlData) {
        const mtlLoader = new MTLLoader(manager);
        const materials = mtlLoader.parse(data.mtlData);
        materials.preload();
        for (const matName in materials.materials) {
           const mat = materials.materials[matName];
           materials.materials[matName] = new THREE.MeshBasicMaterial({
              color: mat.color,
              map: mat.map,
              side: THREE.DoubleSide
           });
        }
        objLoader.setMaterials(materials);
        hasMaterials = true;
      }

      const object = objLoader.parse(data.objData);

      if (!hasMaterials && data.textureUrl) {
        const texLoader = new THREE.TextureLoader();
        texLoader.load(data.textureUrl, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          object.traverse((child) => {
              if (child.isMesh) {
                  child.material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
              }
          });
        });
      } else if (!hasMaterials) {
        object.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
          }
        });
      }
      return object;
    };

    const combinedGroup = new THREE.Group();
    const upperObj = loadArch('upper');
    const lowerObj = loadArch('lower');
    
    if (upperObj) {
       upperObj.name = 'upperJaw';
       combinedGroup.add(upperObj);
    }
    if (lowerObj) {
       lowerObj.name = 'lowerJaw';
       combinedGroup.add(lowerObj);
    }

    const box = new THREE.Box3().setFromObject(combinedGroup);
    const center = box.getCenter(new THREE.Vector3());
    combinedGroup.position.sub(center);
    
    // Toggle visibility based on displayMode
    if (upperObj) upperObj.visible = displayMode === 'both' || displayMode === 'upper';
    if (lowerObj) lowerObj.visible = displayMode === 'both' || displayMode === 'lower';
    
    objectGroupRef.current.add(combinedGroup);

    if (cameraRef.current && controlsRef.current) {
       const size = box.getSize(new THREE.Vector3());
       const maxDim = Math.max(size.x, size.y, size.z);
       cameraRef.current.position.set(0, -maxDim * 0.8, maxDim * 0.8);
       controlsRef.current.target.set(0, 0, 0);
       controlsRef.current.update();
    }
  }, [sharedData, viewMode, showReport, displayMode]);

  useEffect(() => {
       if (objectGroupRef.current) {
          let lowerPivot = null;
          let upperPivot = null;
          objectGroupRef.current.traverse((child) => {
             if (child.name === 'lowerPivot') lowerPivot = child;
             if (child.name === 'upperPivot') upperPivot = child;
          });
          
          // 90 degrees total = 45 degrees each
          const maxAngle = Math.PI / 4;
          const angle = (openMouth / 100) * maxAngle;
          
          if (lowerPivot) {
             lowerPivot.rotation.x = angle;
          }
          
          if (upperPivot) {
             upperPivot.rotation.x = -angle;
          }
       }
    }, [openMouth]);

  useEffect(() => {
    if (!selectedTooth || !cameraRef.current || !controlsRef.current) return;
    
    const q = Math.floor(selectedTooth / 10);
    const camera = cameraRef.current;
    const radius = Math.sqrt(camera.position.x**2 + camera.position.y**2 + camera.position.z**2) || 100;
    
    let targetX = 0;
    let targetZ = radius * 0.8;
    
    if (q === 1 || q === 4) targetX = radius * 0.5;
    if (q === 2 || q === 3) targetX = -radius * 0.5;
    
    camera.position.set(targetX, camera.position.y, targetZ);
    controlsRef.current.update();
  }, [selectedTooth]);

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const images = sharedData && sharedData[arch] ? sharedData[arch].images : [];

  const changeCameraView = (viewName) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    setIsAutoRotating(false); // Stop rotating if user clicks a specific view
    setActiveView(viewName);
    
    // Reset target to origin
    controlsRef.current.target.set(0, 0, 0);

    const distance = 80;
    
    switch (viewName) {
      case 'front':
        cameraRef.current.position.set(0, 0, distance);
        break;
      case 'left':
        cameraRef.current.position.set(-distance, 0, 0);
        break;
      case 'right':
        cameraRef.current.position.set(distance, 0, 0);
        break;
      case 'top':
        cameraRef.current.position.set(0, distance, 0.1);
        break;
      case 'bottom':
        cameraRef.current.position.set(0, -distance, 0.1);
        break;
      default:
        cameraRef.current.position.set(0, -100, 100);
    }
    
    controlsRef.current.update();
  };

  return (
    <div className="viewer-container">
      <div className="viewer-sidebar left-sidebar blur-panel">
        <h2 className="sidebar-title">Diagnostic Pro</h2>
        
        {!sharedData && (
          <div className="empty-state-notice">
            <p>Please capture data in Dataset Studio first.</p>
          </div>
        )}

        
        {viewMode === '3d' ? (
          <>
            <div className="segmented-control" style={{ marginBottom: '15px' }}>
              <button className={displayMode === 'upper' ? 'active' : ''} onClick={() => setDisplayMode('upper')}>Upper</button>
              <button className={displayMode === 'both' ? 'active' : ''} onClick={() => setDisplayMode('both')}>Both</button>
              <button className={displayMode === 'lower' ? 'active' : ''} onClick={() => setDisplayMode('lower')}>Lower</button>
            </div>
            {displayMode === 'both' && (
              <div className="control-group" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <label className="section-label" style={{ marginBottom: '8px' }}>Open Mouth</label>
                   <span style={{ fontSize: '12px', color: '#6b7280' }}>{openMouth}%</span>
                </div>
                <input type="range" min="0" max="100" value={openMouth} onChange={(e) => setOpenMouth(e.target.value)} style={{ width: '100%' }} />
              </div>
            )}
            
            <div className="control-group" style={{ marginBottom: '15px' }}>
              <label className="section-label" style={{ marginBottom: '8px' }}>Camera Angle</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                 <button className={`view-pill ${activeView === 'front' ? 'active' : ''}`} onClick={() => changeCameraView('front')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'front' ? '#5c6ff1' : 'white', color: activeView === 'front' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Front</button>
                 <button className={`view-pill ${activeView === 'left' ? 'active' : ''}`} onClick={() => changeCameraView('left')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'left' ? '#5c6ff1' : 'white', color: activeView === 'left' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Left</button>
                 <button className={`view-pill ${activeView === 'right' ? 'active' : ''}`} onClick={() => changeCameraView('right')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'right' ? '#5c6ff1' : 'white', color: activeView === 'right' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Right</button>
                 <button className={`view-pill ${activeView === 'top' ? 'active' : ''}`} onClick={() => changeCameraView('top')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'top' ? '#5c6ff1' : 'white', color: activeView === 'top' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Top</button>
                 <button className={`view-pill ${activeView === 'bottom' ? 'active' : ''}`} onClick={() => changeCameraView('bottom')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'bottom' ? '#5c6ff1' : 'white', color: activeView === 'bottom' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Bottom</button>
              </div>
            </div>
          </>
        ) : (
          <div className="segmented-control">
            <button className={arch === 'upper' ? 'active' : ''} onClick={() => setArch('upper')}>Upper Arch</button>
            <button className={arch === 'lower' ? 'active' : ''} onClick={() => setArch('lower')}>Lower Arch</button>
          </div>
        )}

        <hr className="divider" />

        <div className="control-group">
          <h3 className="section-label">AI Analysis</h3>
          {isAnalyzing ? (
            <p style={{ color: '#0071e3', fontWeight: '500' }}>กำลังให้ AI ประมวลผลภาพ...</p>
          ) : (
            <>
               <p style={{ color: '#34c759', fontWeight: '500' }}>AI ประมวลผลเสร็จสมบูรณ์</p>
               {aiMasks[arch] && aiMasks[arch].length > 0 && (
                 <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>ภาพจำแนกจาก AI สำหรับฟัน{arch === 'upper' ? 'บน' : 'ล่าง'} ({aiMasks[arch].length} ภาพ)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {aiMasks[arch].map((maskObj, idx) => (
                          <div key={idx}>
                             <p style={{ fontSize: '10px', color: '#888', margin: '0 0 2px 0' }}>{maskObj.name}</p>
                             <img src={maskObj.url} alt={`AI Mask ${idx}`} style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd' }} />
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </>
          )}
          <button className="apple-btn secondary" style={{ marginTop: '15px' }} onClick={() => setShowReport(true)}>Generate Report</button>
        </div>

        <div className="control-group">
          <h3 className="section-label">Overlays</h3>
          <label className="filter-label">
            <input type="checkbox" checked={filters.toothNumber} onChange={() => toggleFilter('toothNumber')} />
            <span className="label-text">FDI Numbering (11-48, 51-85)</span>
          </label>
          <label className="filter-label">
            <input type="checkbox" checked={filters.earlyCaries} onChange={() => toggleFilter('earlyCaries')} />
            <span className="color-box early"></span>
            <span className="label-text">Early Caries</span>
          </label>
          <label className="filter-label">
            <input type="checkbox" checked={filters.advancedCaries} onChange={() => toggleFilter('advancedCaries')} />
            <span className="color-box advanced"></span>
            <span className="label-text">Advanced Caries</span>
          </label>
          <label className="filter-label">
            <input type="checkbox" checked={filters.calculus} onChange={() => toggleFilter('calculus')} />
            <span className="color-box calculus"></span>
            <span className="label-text">Calculus</span>
          </label>
        </div>
      </div>
      
      <div className="viewer-main">
        {!sharedData ? (
          <div className="placeholder-main">
            <svg className="placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
            <h3>No Data Available</h3>
            <p>Go to Dataset Studio to process a scan.</p>
          </div>
        ) : (
          <div className="split-layout">
            <div className="split-top">
              <div className={`view-layer ${viewMode === '3d' ? 'active' : 'hidden'}`}>
                 <div 
                   style={isFullscreen ? {
                     position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: '#F5F5F7'
                   } : { width: '100%', height: '100%', position: 'relative' }}
                 >
                   <div ref={mountRef} className="canvas-container" style={{ width: '100%', height: '100%' }}></div>
                   
                   {/* Fullscreen & Rotate Controls */}
                   
                   {/* View Controls */}
                     <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                     <button 
                       onClick={() => setIsAutoRotating(!isAutoRotating)}
                       style={{ padding: '8px 12px', background: isAutoRotating ? '#007AFF' : 'rgba(255,255,255,0.8)', color: isAutoRotating ? 'white' : 'black', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
                     >
                       {isAutoRotating ? '■ หยุดหมุน' : '▶ หมุน 360°'}
                     </button>
                     <button 
                       onClick={() => setIsFullscreen(!isFullscreen)}
                       style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.8)', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
                     >
                       {isFullscreen ? 'ย่อจอ (Exit)' : 'เต็มจอ (Full Screen)'}
                     </button>
                   </div>
                 </div>
              </div>

              <div className={`view-layer ${viewMode === '2d' ? 'active' : 'hidden'}`}>
                 <div className="gallery-grid">
                   {images.map((img, idx) => (
                     <div key={idx} className="gallery-item apple-card">
                       <img src={img.url} alt={img.name} />
                       <div className="gallery-item-label">{img.name.replace(/_/g, ' ')}</div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
            
            <div className="split-bottom">
              <OdontogramEditor 
                findings={findings}
                setFindings={setFindings}
                selectedTooth={selectedTooth}
                setSelectedTooth={setSelectedTooth}
                patient={patient}
                onSaveRecord={handleSaveRecord}
              />
            </div>
          </div>
        )}
      </div>

      {showReport && (
        <OralHealthReport 
          patient={patient}
          findings={findings}
          sharedData={sharedData}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}






