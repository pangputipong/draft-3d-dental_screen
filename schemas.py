from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PatientBase(BaseModel):
    hn: str
    firstName: str
    lastName: str
    dob: str
    gender: str
    phone: str
    address: str

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int

    class Config:
        from_attributes = True

class ToothFindingBase(BaseModel):
    tooth_number: int
    conditions: str
    note: str

class ToothFindingCreate(ToothFindingBase):
    pass

class ToothFinding(ToothFindingBase):
    id: int
    record_id: int

    class Config:
        from_attributes = True

class DiagnosticRecordBase(BaseModel):
    patient_id: int
    zip_url: Optional[str] = None
    dentist_name: str = "Dr. User"

class DiagnosticRecordCreate(DiagnosticRecordBase):
    findings: List[ToothFindingCreate]

class DiagnosticRecord(DiagnosticRecordBase):
    id: int
    timestamp: datetime
    findings: List[ToothFinding] = []
    patient: Optional[Patient] = None
    
    class Config:
        from_attributes = True
