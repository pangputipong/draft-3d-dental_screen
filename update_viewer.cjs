const fs = require('fs');
let code = fs.readFileSync('src/DiagnosticViewer.jsx', 'utf8');

// 1. Add openMouth state and displayMode state
code = code.replace(
  /const \[arch, setArch\] = useState\('upper'\);/,
  "const [arch, setArch] = useState('upper');\n  const [displayMode, setDisplayMode] = useState('both');\n  const [openMouth, setOpenMouth] = useState(0);"
);

// 2. Replace the 3D rendering useEffect
const oldUseEffectRegex = /useEffect\(\(\) => \{\s*if \(viewMode !== '3d' \|\| !sharedData \|\| !sharedData\[arch\] \|\| showReport\) return;[\s\S]*?\}, \[sharedData, arch, viewMode, showReport\]\);/;
const newUseEffect = \useEffect(() => {
    if (viewMode !== '3d' || !sharedData || showReport) return;

    objectGroupRef.current.clear();

    const loadArch = (archName) => {
      const data = sharedData[archName];
      if (!data || !data.objData) return null;

      const manager = new THREE.LoadingManager();
      if (sharedData.assetMap) {
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
    
    // Visibility toggle
    if (upperObj) upperObj.visible = displayMode === 'both' || displayMode === 'upper';
    if (lowerObj) lowerObj.visible = displayMode === 'both' || displayMode === 'lower';
    
    objectGroupRef.current.add(combinedGroup);

    if (cameraRef.current && controlsRef.current) {
       const size = box.getSize(new THREE.Vector3());
       const maxDim = Math.max(size.x, size.y, size.z);
       cameraRef.current.position.set(0, -maxDim * 1.5, maxDim);
       controlsRef.current.target.set(0, 0, 0);
       controlsRef.current.update();
    }
  }, [sharedData, viewMode, showReport, displayMode]);

  useEffect(() => {
     if (objectGroupRef.current) {
        objectGroupRef.current.traverse((child) => {
           if (child.name === 'lowerJaw') {
              child.position.y = -openMouth * 0.3; 
           }
        });
     }
  }, [openMouth]);\;
code = code.replace(oldUseEffectRegex, newUseEffect);

// 3. Update the UI layout
const oldUIRegex = /\{\/\* View Preset Controls \(Mobile App Style\) \*\/\}[\\s\\S]*?<div style=\{\{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px'/;
const newUI = \
  {/* The view preset controls have been moved to the sidebar */}
  <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px'\;
code = code.replace(oldUIRegex, newUI);

const oldSidebarUIRegex = /\{viewMode === '3d' \? \([\s\S]*?<div className="segmented-control">[\s\S]*?<\/div>[\s\S]*?\}[\s\S]*?<hr className="divider" \/>/;
const newSidebarUI = \
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
                 <button className={\iew-pill \\} onClick={() => changeCameraView('front')} style={{ padding: '6px', fontSize: '12px' }}>Front</button>
                 <button className={\iew-pill \\} onClick={() => changeCameraView('left')} style={{ padding: '6px', fontSize: '12px' }}>Left</button>
                 <button className={\iew-pill \\} onClick={() => changeCameraView('right')} style={{ padding: '6px', fontSize: '12px' }}>Right</button>
                 <button className={\iew-pill \\} onClick={() => changeCameraView('top')} style={{ padding: '6px', fontSize: '12px' }}>Top</button>
                 <button className={\iew-pill \\} onClick={() => changeCameraView('bottom')} style={{ padding: '6px', fontSize: '12px' }}>Bottom</button>
              </div>
            </div>
          </>
        ) : (
          <div className="segmented-control">
            <button className={arch === 'upper' ? 'active' : ''} onClick={() => setArch('upper')}>Upper Arch</button>
            <button className={arch === 'lower' ? 'active' : ''} onClick={() => setArch('lower')}>Lower Arch</button>
          </div>
        )}

        <hr className="divider" />\;
code = code.replace(oldSidebarUIRegex, newSidebarUI);

fs.writeFileSync('src/DiagnosticViewer.jsx', code);
