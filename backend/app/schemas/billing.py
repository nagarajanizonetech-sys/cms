from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class BillItemCreate(BaseModel):
    service_name: str
    description: Optional[str] = None
    quantity: int = 1
    unit_price: float
    total: Optional[float] = None  # calculated if not provided


class BillItemResponse(BaseModel):
    id: int
    bill_id: int
    service_name: str
    description: Optional[str] = None
    quantity: int
    unit_price: float
    total: float

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    amount: float
    payment_method: str  # CASH / UPI / CARD / OTHER
    transaction_reference: Optional[str] = None
    note: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    bill_id: int
    receipt_number: str
    amount: float
    payment_method: str
    transaction_reference: Optional[str] = None
    note: Optional[str] = None
    received_by: Optional[int] = None
    receiver_name: Optional[str] = None
    payment_date: datetime

    model_config = {"from_attributes": True}


class BillCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    discount: float = 0.0
    tax: float = 0.0
    notes: Optional[str] = None
    items: List[BillItemCreate] = []


class BillUpdate(BaseModel):
    discount: Optional[float] = None
    tax: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[BillItemCreate]] = None


class BillResponse(BaseModel):
    id: int
    bill_number: str
    patient_id: int
    patient_name: Optional[str] = None
    patient_uhid: Optional[str] = None
    appointment_id: Optional[int] = None
    subtotal: float
    discount: float
    tax: float
    total: float
    paid_amount: float
    balance_amount: float
    status: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    creator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[BillItemResponse] = []
    payments: List[PaymentResponse] = []

    model_config = {"from_attributes": True}


class BillListResponse(BaseModel):
    total: int
    bills: List[BillResponse]
