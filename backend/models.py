"""
SQLAlchemy + GeoAlchemy2 Models for PostgreSQL + PostGIS
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    road_name = Column(String(150), nullable=False)
    status = Column(String(20), default="active")

    plate_events = relationship("PlateEvent", back_populates="camera")
    pothole_events = relationship("PotholeEvent", back_populates="camera")
    accident_events = relationship("AccidentEvent", back_populates="camera")

class PlateEvent(Base):
    __tablename__ = "plate_events"
    id = Column(String(50), primary_key=True)
    plate_text = Column(String(20), index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    image_path = Column(String(255), nullable=True)

    camera = relationship("Camera", back_populates="plate_events")

class PotholeEvent(Base):
    __tablename__ = "pothole_events"
    id = Column(String(50), primary_key=True)
    severity = Column(String(20), nullable=False, index=True) # low, medium, high, critical
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    image_path = Column(String(255), nullable=True)
    status = Column(String(20), default="reported") # reported, scheduled, fixed
    area_sq_cm = Column(Float, nullable=True)
    confidence = Column(Float, default=0.9)

    camera = relationship("Camera", back_populates="pothole_events")

class AccidentEvent(Base):
    __tablename__ = "accident_events"
    id = Column(String(50), primary_key=True)
    severity = Column(String(20), nullable=False, index=True) # minor, moderate, severe, critical
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    clip_path = Column(String(255), nullable=True)
    confirmed = Column(Boolean, default=True)
    vehicles_involved = Column(Integer, default=2)
    collision_type = Column(String(50), default="rear_end")
    deceleration_g = Column(Float, default=3.5)

    camera = relationship("Camera", back_populates="accident_events")

class Blacklist(Base):
    __tablename__ = "blacklist"
    id = Column(String(50), primary_key=True)
    plate_text = Column(String(20), unique=True, index=True, nullable=False)
    reason = Column(Text, nullable=False)
    flag_level = Column(String(20), default="urgent")
    added_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String(50), primary_key=True)
    type = Column(String(30), nullable=False) # blacklist, accident, hazard
    reference_id = Column(String(50), nullable=False)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged = Column(Boolean, default=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="high")
