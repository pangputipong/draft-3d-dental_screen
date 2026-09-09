const fs = require('fs');

let jsx = fs.readFileSync('src/DiagnosticViewer.jsx', 'utf8');

const targetRegex = /const combinedGroup = new THREE\.Group\(\);[\s\S]*?controlsRef\.current\.update\(\);\n      \}/;

const newContent = `const combinedGroup = new THREE.Group();
      const upperObj = loadArch('upper');
      const lowerObj = loadArch('lower');
      
      const upperPivot = new THREE.Group();
      upperPivot.name = 'upperPivot';
      const lowerPivot = new THREE.Group();
      lowerPivot.name = 'lowerPivot';

      // We need to calculate TMJ pivot before transforming
      let tmjY = 0;
      if (lowerObj) {
         const boxLower = new THREE.Box3().setFromObject(lowerObj);
         // The model is standing on front teeth, so max.y is the back (TMJ)
         tmjY = boxLower.max.y;
      } else if (upperObj) {
         const boxUpper = new THREE.Box3().setFromObject(upperObj);
         tmjY = boxUpper.max.y;
      }

      // Setup pivots
      upperPivot.position.set(0, tmjY, 0);
      lowerPivot.position.set(0, tmjY, 0);

      if (upperObj) {
         upperObj.name = 'upperJaw';
         upperObj.position.set(0, -tmjY, 0);
         upperPivot.add(upperObj);
         combinedGroup.add(upperPivot);
      }
      if (lowerObj) {
         lowerObj.name = 'lowerJaw';
         lowerObj.position.set(0, -tmjY, 0);
         lowerPivot.add(lowerObj);
         combinedGroup.add(lowerPivot);
      }

      const box = new THREE.Box3().setFromObject(combinedGroup);
      const center = box.getCenter(new THREE.Vector3());
      combinedGroup.position.sub(center);
      
      // Lay the jaws flat so occlusal plane is horizontal
      combinedGroup.rotation.x = -Math.PI / 2;

      // Toggle visibility based on displayMode
      if (upperObj) upperObj.visible = displayMode === 'both' || displayMode === 'upper';
      if (lowerObj) lowerObj.visible = displayMode === 'both' || displayMode === 'lower';
      
      objectGroupRef.current.add(combinedGroup);

      if (cameraRef.current && controlsRef.current) {
         const size = box.getSize(new THREE.Vector3());
         const maxDim = Math.max(size.x, size.y, size.z);
         cameraRef.current.position.set(0, maxDim * 0.8, maxDim * 1.5);
         controlsRef.current.target.set(0, 0, 0);
         controlsRef.current.update();
      }`;

jsx = jsx.replace(targetRegex, newContent);
fs.writeFileSync('src/DiagnosticViewer.jsx', jsx);
console.log('Done 3d loading setup!');
