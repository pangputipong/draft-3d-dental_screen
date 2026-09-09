const fs = require("fs");
let code = fs.readFileSync("src/DiagnosticViewer.jsx", "utf8");

// 1. Move camera buttons out of the 3D viewer and into the sidebar
const sidebarRegex = /\{viewMode === '3d' \? \([\s\S]*?<div className="segmented-control">[\s\S]*?<\/div>[\s\S]*?\}[\s\S]*?<hr className="divider" \/>/;
const newSidebar = `
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
                 <button className={\`view-pill \${activeView === 'front' ? 'active' : ''}\`} onClick={() => changeCameraView('front')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'front' ? '#5c6ff1' : 'white', color: activeView === 'front' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Front</button>
                 <button className={\`view-pill \${activeView === 'left' ? 'active' : ''}\`} onClick={() => changeCameraView('left')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'left' ? '#5c6ff1' : 'white', color: activeView === 'left' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Left</button>
                 <button className={\`view-pill \${activeView === 'right' ? 'active' : ''}\`} onClick={() => changeCameraView('right')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'right' ? '#5c6ff1' : 'white', color: activeView === 'right' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Right</button>
                 <button className={\`view-pill \${activeView === 'top' ? 'active' : ''}\`} onClick={() => changeCameraView('top')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'top' ? '#5c6ff1' : 'white', color: activeView === 'top' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Top</button>
                 <button className={\`view-pill \${activeView === 'bottom' ? 'active' : ''}\`} onClick={() => changeCameraView('bottom')} style={{ padding: '8px', fontSize: '12px', borderRadius: '8px', background: activeView === 'bottom' ? '#5c6ff1' : 'white', color: activeView === 'bottom' ? 'white' : '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Bottom</button>
              </div>
            </div>
          </>
        ) : (
          <div className="segmented-control">
            <button className={arch === 'upper' ? 'active' : ''} onClick={() => setArch('upper')}>Upper Arch</button>
            <button className={arch === 'lower' ? 'active' : ''} onClick={() => setArch('lower')}>Lower Arch</button>
          </div>
        )}

        <hr className="divider" />`;

code = code.replace(sidebarRegex, newSidebar);

// 2. Remove the old view pills from the canvas overlay
const oldPillsRegex = /\{\/\* View Preset Controls \(Mobile App Style\) \*\/\}[\s\S]*?<div style=\{\{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px'/;
const replacement = `{/* View Controls */}
                     <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px'`;
code = code.replace(oldPillsRegex, replacement);

fs.writeFileSync("src/DiagnosticViewer.jsx", code);
console.log("Updated UI");
