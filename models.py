from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    hn = Column(String, unique=True, index=True)
    firstName = Column(String)
    lastName = Column(String)
    dob = Column(String)
    gender = Column(String)
    phone = Column(String)
    address = Column(String)
    
    records = relationship("DiagnosticRecord", back_populates="patient")

class DiagnosticRecord(Base):
    __tablename__ = "diagnostic_records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    zip_url = Column(String, nullable=True)  # URL to the uploaded 3D zip file
    dentist_name = Column(String, default="Dr. User")
    
    patient = relationship("Patient", back_populates="records")
    findings = relationship("ToothFinding", back_populates="record")

class ToothFinding(Base):
    __tablename__ = "tooth_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("diagnostic_records.id"))
    tooth_number = Column(Integer)
    conditions = Column(String) # Comma separated conditions e.g. "Caries-Deep,Filling"
    note = Column(String)
    
    record = relationship("DiagnosticRecord", back_populates="findings")
