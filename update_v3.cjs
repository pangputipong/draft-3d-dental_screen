const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace('flex: 1;\n  background-color: var(--surface-color);', 'flex: 1.5;\n  min-height: 400px;\n  background-color: var(--surface-color);');
css = css.replace('flex-shrink: 0;\n  height: 500px; /* much taller for odontogram */', 'flex: 1;\n  min-height: 350px;\n  overflow-y: auto;');
css = css.replace('align-items: center;', 'align-items: stretch;');
fs.writeFileSync('src/index.css', css);

let jsx = fs.readFileSync('src/DiagnosticViewer.jsx', 'utf8');

// Fix 3D jaw opening and orientation
const oldJawRegex = /\/\/ Realistic mouth opening[\s\S]*?upperJaw\.position\.z = 0;\n\s*\}/;
const newJaw = `
        const boxLower = new THREE.Box3().setFromObject(lowerJaw);
        const pivotY = boxLower.max.y; // The back of the jaw (TMJ)

        // Find or create upper pivot
        let upperPivot = objectGroupRef.current.children.find(c => c.name === 'upperPivot');
        if (!upperPivot) {
            upperPivot = new THREE.Group();
            upperPivot.name = 'upperPivot';
            upperPivot.position.set(0, pivotY, 0);
            upperJaw.position.set(0, -pivotY, 0);
            upperPivot.add(upperJaw);
            objectGroupRef.current.children.find(c => c.type === 'Group').add(upperPivot);
        }

        // Find or create lower pivot
        let lowerPivot = objectGroupRef.current.children.find(c => c.name === 'lowerPivot');
        if (!lowerPivot) {
            lowerPivot = new THREE.Group();
            lowerPivot.name = 'lowerPivot';
            lowerPivot.position.set(0, pivotY, 0);
            lowerJaw.position.set(0, -pivotY, 0);
            lowerPivot.add(lowerJaw);
            objectGroupRef.current.children.find(c => c.type === 'Group').add(lowerPivot);
        }

        // 90 degrees total = 45 degrees each
        const maxAngle = Math.PI / 4;
        const angle = (openMouth / 100) * maxAngle;
        
        lowerPivot.rotation.x = angle;
        upperPivot.rotation.x = -angle;
`;

if (oldJawRegex.test(jsx)) {
    jsx = jsx.replace(oldJawRegex, newJaw);
}

// Fix orientation of combinedGroup
const boxLine = "const box = new THREE.Box3().setFromObject(combinedGroup);";
const boxFix = `combinedGroup.rotation.x = -Math.PI / 2; // Lay flat
      const box = new THREE.Box3().setFromObject(combinedGroup);`;
jsx = jsx.replace(boxLine, boxFix);

fs.writeFileSync('src/DiagnosticViewer.jsx', jsx);
console.log("Updated fixes.");
