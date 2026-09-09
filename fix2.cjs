const fs = require("fs");
let code = fs.readFileSync("src/DiagnosticViewer.jsx", "utf8");

// 1. Fix jaw rotation
const oldJawRotation = /  useEffect\(\(\) => \{\s*if \(objectGroupRef\.current\) \{\s*\/\/ Find the lower jaw[\s\S]*?\} \}, \[openMouth\]\);/;
const newJawRotation = `  useEffect(() => {
     if (objectGroupRef.current) {
        let lowerJaw = null;
        let upperJaw = null;
        objectGroupRef.current.traverse((child) => {
           if (child.name === 'lowerJaw') lowerJaw = child;
           if (child.name === 'upperJaw') upperJaw = child;
        });
        
        // 90 degrees total = 45 degrees each
        const angle = (openMouth / 100) * (Math.PI / 4);
        const shiftY = openMouth * 0.3;
        const shiftZ = -openMouth * 0.15;
        
        if (lowerJaw) {
           lowerJaw.rotation.x = angle;
           lowerJaw.position.y = -shiftY;
           lowerJaw.position.z = shiftZ;
        }
        if (upperJaw) {
           upperJaw.rotation.x = -angle;
           upperJaw.position.y = shiftY;
           upperJaw.position.z = shiftZ;
        }
     }
  }, [openMouth]);`;

code = code.replace(oldJawRotation, newJawRotation);

// 2. Fix Gimbal Lock
code = code.replace("cameraRef.current.position.set(0, distance, 0);", "cameraRef.current.position.set(0, distance, 0.1);");
code = code.replace("cameraRef.current.position.set(0, -distance, 0);", "cameraRef.current.position.set(0, -distance, 0.1);");

fs.writeFileSync("src/DiagnosticViewer.jsx", code);
console.log("Updated fixes.");
