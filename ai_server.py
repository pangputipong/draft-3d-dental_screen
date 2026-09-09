import base64
import io
import json
import os
import shutil
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from PIL import Image

# Import Database dependencies
import models
import schemas
from database import engine, get_db

# Create Database Tables
models.Base.metadata.create_all(bind=engine)

# Create uploads directory if not exists
os.makedirs("uploads", exist_ok=True)
from pydantic import BaseModel
from PIL import Image

try:
    import torch
    import cv2
    import segmentation_models_pytorch as smp
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
    has_deps = True
except ImportError as e:
    has_deps = False
    print(f"Missing dependencies: {e}")

app = FastAPI(title="Dental Segmentation API", description="API for tooth segmentation using UnetPlusPlus")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

FDI_MAP = {
    0:"bg", 1:18,2:17,3:16,4:15,5:14,6:13,7:12,8:11,
    9:21,10:22,11:23,12:24,13:25,14:26,15:27,16:28,
    17:38,18:37,19:36,20:35,21:34,22:33,23:32,24:31,
    25:41,26:42,27:43,28:44,29:45,30:46,31:47,32:48,
}

model = None
device = None
transform = None

if has_deps:
    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        model = smp.UnetPlusPlus(
            encoder_name="efficientnet-b3",
            encoder_weights=None,
            classes=33, decoder_attention_type="scse"
        )
        
        checkpoint = torch.load("best_model_all.pt", map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(device)
        model.eval()
        print("Model loaded successfully")
        
        transform = A.Compose([
            A.Resize(512, 512),
            A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
            ToTensorV2()
        ])
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None

class PredictionRequest(BaseModel):
    image_base64: str

@app.post("/predict")
async def predict(request: PredictionRequest):
    if not has_deps or model is None:
        raise HTTPException(
            status_code=500, 
            detail="Model is not loaded. Please ensure libraries (segmentation-models-pytorch, albumentations, opencv) are installed and disk is not full."
        )
        
    try:
        base64_data = request.image_base64
        if "base64," in base64_data:
            base64_data = base64_data.split("base64,")[1]
            
        image_data = base64.b64decode(base64_data)
        nparr = np.frombuffer(image_data, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # --- DEBUG ---
        import time
        ts = int(time.time() * 1000)
        cv2.imwrite(f"uploads/debug_in_{ts}.png", img_cv)
        # -------------
        
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        
        augmented = transform(image=img_rgb)
        img_tensor = augmented["image"].unsqueeze(0).to(device)
        
        with torch.no_grad():
            output = model(img_tensor)
            
        # Apply softmax to get probabilities for each class
        probs = torch.softmax(output, dim=1).squeeze(0) # shape: [33, 512, 512]
        
        # Get the highest probability and corresponding class for each pixel
        max_probs, mask = torch.max(probs, dim=0) # shape: [512, 512]
        
        # Apply 60% confidence threshold (set to background 0 if < 0.6)
        mask[max_probs < 0.60] = 0
        
        mask = mask.cpu().numpy()
        max_probs = max_probs.cpu().numpy()
        
        # Filter noise by requiring at least 500 pixels for a valid tooth detection
        unique_classes, counts = np.unique(mask, return_counts=True)
        detected_ids = [cls_id for cls_id, count in zip(unique_classes, counts) if cls_id != 0 and count > 500]
        
        detections = []
        for cls_id in detected_ids:
            tooth_num = FDI_MAP.get(cls_id)
            if tooth_num:
                # Calculate average confidence for the detected pixels of this tooth
                avg_conf = max_probs[mask == cls_id].mean().item()
                detections.append({
                    "class_name": str(tooth_num),
                    "confidence": round(avg_conf, 2),
                    "bbox": [0, 0, 0, 0] 
                })
                
        # Generate Colored Mask for Visualization
        mask_colored = np.zeros((512, 512, 3), dtype=np.uint8)
        np.random.seed(42)
        colors = np.random.randint(0, 255, size=(100, 3), dtype=np.uint8)
        
        centroids = []
        for cls_id in detected_ids:
            mask_colored[mask == cls_id] = colors[cls_id]
            y_coords, x_coords = np.where(mask == cls_id)
            if len(y_coords) > 0:
                cx = int(np.mean(x_coords))
                cy = int(np.mean(y_coords))
                tooth_num = FDI_MAP.get(cls_id)
                if tooth_num:
                    centroids.append((cx, cy, str(tooth_num)))
            
        img_512 = cv2.resize(img_rgb, (512, 512))
        blended = cv2.addWeighted(img_512, 0.5, mask_colored, 0.5, 0)
        
        # Draw labels on the blended image
        for cx, cy, text in centroids:
            cv2.putText(blended, text, (cx - 10, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 3, cv2.LINE_AA)
            cv2.putText(blended, text, (cx - 10, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
        
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(blended, cv2.COLOR_RGB2BGR))
        mask_base64 = base64.b64encode(buffer).decode('utf-8')
                
        return {"status": "success", "detections": detections, "mask_base64": mask_base64}
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")

# --- DATABASE API ENDPOINTS ---

@app.post("/api/patients", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.hn == patient.hn).first()
    if db_patient:
        return db_patient # Return existing instead of throwing 400
    db_patient = models.Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/api/patients", response_model=list[schemas.Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@app.post("/api/upload_zip")
async def upload_zip_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are allowed")
    
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    return {"url": f"/uploads/{file.filename}", "filename": file.filename}

@app.post("/api/records", response_model=schemas.DiagnosticRecord)
def create_record(record: schemas.DiagnosticRecordCreate, db: Session = Depends(get_db)):
    # Create Record
    db_record = models.DiagnosticRecord(
        patient_id=record.patient_id,
        zip_url=record.zip_url,
        dentist_name=record.dentist_name
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    # Add findings
    for finding in record.findings:
        db_finding = models.ToothFinding(
            record_id=db_record.id,
            tooth_number=finding.tooth_number,
            conditions=finding.conditions,
            note=finding.note
        )
        db.add(db_finding)
        
    db.commit()
    db.refresh(db_record)
    return db_record

@app.get("/api/records", response_model=list[schemas.DiagnosticRecord])
def get_all_records(db: Session = Depends(get_db)):
    # Returns all records (For data archive)
    records = db.query(models.DiagnosticRecord).all()
    return records

@app.get("/api/records/{patient_id}", response_model=list[schemas.DiagnosticRecord])
def get_records_by_patient(patient_id: int, db: Session = Depends(get_db)):
    records = db.query(models.DiagnosticRecord).filter(models.DiagnosticRecord.patient_id == patient_id).all()
    return records


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

