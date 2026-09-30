from __future__ import annotations

import logging
import random
from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, record_audit
from app.core.websocket import notify_data_change
from app.core.notifications import create_system_notifications, get_staff_user_ids
from app.models.appointment import Appointment
from app.models.billing import Bill, BillItem
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.user import User
from app.schemas.billing import (
    BillCreate,
    BillItemCreate,
    BillItemResponse,
    BillListResponse,
    BillResponse,
    BillUpdate,
    PaymentCreate,
    PaymentResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["Billing"])


def _generate_bill_number(db: Session) -> str:
    today_str = date.today().strftime("%Y%m%d")
    count = db.query(Bill).count() + 1
    rand = random.randint(10, 99)
    num = f"INV-{today_str}-{count:03d}{rand}"
    while db.query(Bill).filter(Bill.bill_number == num).first():
        rand = random.randint(100, 999)
        num = f"INV-{today_str}-{count:03d}{rand}"
    return num


def _generate_receipt_number(db: Session) -> str:
    today_str = date.today().strftime("%Y%m%d")
    count = db.query(Payment).count() + 1
    rand = random.randint(10, 99)
    num = f"REC-{today_str}-{count:03d}{rand}"
    while db.query(Payment).filter(Payment.receipt_number == num).first():
        rand = random.randint(100, 999)
        num = f"REC-{today_str}-{count:03d}{rand}"
    return num


def auto_create_bill_for_appointment(
    db: Session,
    appt: Appointment,
    user_id: int,
    fee: Optional[float] = None,
) -> Optional[Bill]:
    """Automatically generate consultation bill when patient enters queue, if none exists."""
    existing_bill = db.query(Bill).filter(Bill.appointment_id == appt.id).first()
    if existing_bill:
        return existing_bill

    allocated_fee = (
        fee if (fee is not None and fee > 0)
        else (float(appt.doctor.consultation_fee) if (appt.doctor and appt.doctor.consultation_fee) else 500.0)
    )
    allocated_fee = round(allocated_fee, 2)
    bill_number = _generate_bill_number(db)
    bill = Bill(
        bill_number=bill_number,
        patient_id=appt.patient_id,
        appointment_id=appt.id,
        subtotal=allocated_fee,
        discount=0.0,
        tax=0.0,
        total=allocated_fee,
        paid_amount=0.0,
        balance_amount=allocated_fee,
        status="PENDING",
        notes=f"Auto-generated on queue entry for Token {appt.token_number or 'Waiting'}",
        created_by=user_id,
    )
    db.add(bill)
    db.flush()

    doctor_name = "Doctor"
    if appt.doctor and appt.doctor.user and appt.doctor.user.full_name:
        doctor_name = appt.doctor.user.full_name

    item = BillItem(
        bill_id=bill.id,
        service_name="Consultation",
        description=f"Consultation with {doctor_name}",
        quantity=1,
        unit_price=allocated_fee,
        total=allocated_fee,
    )
    db.add(item)
    db.commit()
    db.refresh(bill)

    record_audit(
        db,
        action="AUTO_GENERATE_BILL_ON_QUEUE_ENTRY",
        user_id=user_id,
        entity_type="Bill",
        entity_id=bill.id,
    )
    notify_data_change("billing_updated", {"id": bill.id, "action": "created"})
    return bill


def _map_payment_response(p: Payment, db: Session) -> PaymentResponse:
    receiver_name = None
    if p.received_by:
        user = db.query(User).filter(User.id == p.received_by).first()
        if user:
            receiver_name = user.full_name

    return PaymentResponse(
        id=p.id,
        bill_id=p.bill_id,
        receipt_number=p.receipt_number,
        amount=float(p.amount),
        payment_method=p.payment_method,
        transaction_reference=p.transaction_reference,
        note=p.note,
        received_by=p.received_by,
        receiver_name=receiver_name,
        payment_date=p.payment_date,
    )


def _map_bill_response(b: Bill, db: Session) -> BillResponse:
    creator_name = None
    if b.created_by:
        user = db.query(User).filter(User.id == b.created_by).first()
        if user:
            creator_name = user.full_name

    return BillResponse(
        id=b.id,
        bill_number=b.bill_number,
        patient_id=b.patient_id,
        patient_name=b.patient.full_name if b.patient else None,
        patient_uhid=b.patient.uhid if b.patient else None,
        appointment_id=b.appointment_id,
        subtotal=float(b.subtotal),
        discount=float(b.discount),
        tax=float(b.tax),
        total=float(b.total),
        paid_amount=float(b.paid_amount),
        balance_amount=float(b.balance_amount),
        status=b.status,
        notes=b.notes,
        created_by=b.created_by,
        creator_name=creator_name,
        created_at=b.created_at,
        updated_at=b.updated_at,
        items=[
            BillItemResponse(
                id=item.id,
                bill_id=item.bill_id,
                service_name=item.service_name,
                description=item.description,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                total=float(item.total),
            )
            for item in b.items
        ],
        payments=[_map_payment_response(p, db) for p in b.payments],
    )


@router.get("", response_model=BillListResponse)
def list_bills(
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List bills with optional filters for patient and status."""
    query = db.query(Bill)

    if patient_id:
        query = query.filter(Bill.patient_id == patient_id)
    if status:
        query = query.filter(Bill.status == status.upper())

    total = query.count()
    bills = query.order_by(Bill.created_at.desc()).offset(skip).limit(limit).all()

    return BillListResponse(
        total=total,
        bills=[_map_bill_response(b, db) for b in bills],
    )


@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(
    data: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new patient invoice with itemized services."""
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if data.appointment_id:
        existing_bill = db.query(Bill).filter(Bill.appointment_id == data.appointment_id).first()
        if existing_bill:
            # Map existing line items by normalized service name
            existing_items_by_name = {item.service_name.strip().lower(): item for item in existing_bill.items}
            for item_in in data.items:
                item_total = (
                    item_in.total
                    if item_in.total is not None
                    else round(item_in.quantity * item_in.unit_price, 2)
                )
                svc_key = item_in.service_name.strip().lower()
                if svc_key in existing_items_by_name:
                    match_item = existing_items_by_name[svc_key]
                    match_item.unit_price = item_in.unit_price
                    match_item.quantity = item_in.quantity
                    match_item.total = item_total
                    if item_in.description:
                        match_item.description = item_in.description
                else:
                    new_item = BillItem(
                        bill_id=existing_bill.id,
                        service_name=item_in.service_name,
                        description=item_in.description,
                        quantity=item_in.quantity,
                        unit_price=item_in.unit_price,
                        total=item_total,
                    )
                    db.add(new_item)

            db.flush()
            # Recalculate totals
            subtotal = sum(item.total for item in existing_bill.items)
            existing_bill.subtotal = round(subtotal, 2)
            if data.discount is not None:
                existing_bill.discount = data.discount
            if data.tax is not None:
                existing_bill.tax = data.tax
            existing_bill.total = max(0.0, round(float(existing_bill.subtotal) - float(existing_bill.discount) + float(existing_bill.tax), 2))
            existing_bill.balance_amount = max(0.0, round(float(existing_bill.total) - float(existing_bill.paid_amount), 2))

            if existing_bill.balance_amount <= 0.001:
                existing_bill.status = "PAID"
            elif float(existing_bill.paid_amount) > 0:
                existing_bill.status = "PARTIALLY_PAID"
            else:
                existing_bill.status = "PENDING"

            if data.notes:
                existing_bill.notes = data.notes

            existing_bill.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing_bill)

            record_audit(
                db,
                action="UPDATE_BILL",
                user_id=current_user.id,
                entity_type="Bill",
                entity_id=existing_bill.id,
            )
            notify_data_change("billing_updated", {"id": existing_bill.id, "action": "updated"})
            return _map_bill_response(existing_bill, db)

    bill_number = _generate_bill_number(db)

    # Compute line items total
    subtotal = 0.0
    processed_items: List[BillItem] = []
    for item_in in data.items:
        item_total = (
            item_in.total
            if item_in.total is not None
            else round(item_in.quantity * item_in.unit_price, 2)
        )
        subtotal += item_total
        processed_items.append(
            BillItem(
                service_name=item_in.service_name,
                description=item_in.description,
                quantity=item_in.quantity,
                unit_price=item_in.unit_price,
                total=item_total,
            )
        )

    subtotal = round(subtotal, 2)
    total = max(0.0, round(subtotal - data.discount + data.tax, 2))
    balance_amount = total

    bill = Bill(
        bill_number=bill_number,
        patient_id=data.patient_id,
        appointment_id=data.appointment_id,
        subtotal=subtotal,
        discount=data.discount,
        tax=data.tax,
        total=total,
        paid_amount=0.0,
        balance_amount=balance_amount,
        status="PENDING",
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(bill)
    db.flush()

    for item in processed_items:
        item.bill_id = bill.id
        db.add(item)

    db.commit()
    db.refresh(bill)

    record_audit(
        db,
        action="CREATE_BILL",
        user_id=current_user.id,
        entity_type="Bill",
        entity_id=bill.id,
    )

    notify_data_change("billing_updated", {"id": bill.id, "action": "created"})
    return _map_bill_response(bill, db)


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get bill invoice by ID."""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return _map_bill_response(bill, db)


@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(
    bill_id: int,
    data: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update bill charges, discount, tax, or notes."""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if data.items is not None:
        db.query(BillItem).filter(BillItem.bill_id == bill.id).delete()
        subtotal = 0.0
        for item_in in data.items:
            item_total = (
                item_in.total
                if item_in.total is not None
                else round(item_in.quantity * item_in.unit_price, 2)
            )
            subtotal += item_total
            new_item = BillItem(
                bill_id=bill.id,
                service_name=item_in.service_name,
                description=item_in.description,
                quantity=item_in.quantity,
                unit_price=item_in.unit_price,
                total=item_total,
            )
            db.add(new_item)
        bill.subtotal = round(subtotal, 2)

    if data.discount is not None:
        bill.discount = round(data.discount, 2)
    if data.tax is not None:
        bill.tax = round(data.tax, 2)
    if data.notes is not None:
        bill.notes = data.notes

    # Recalculate totals
    bill.total = max(0.0, round(float(bill.subtotal) - float(bill.discount) + float(bill.tax), 2))
    bill.balance_amount = max(0.0, round(float(bill.total) - float(bill.paid_amount), 2))

    if bill.balance_amount <= 0.001:
        bill.status = "PAID"
    elif float(bill.paid_amount) > 0:
        bill.status = "PARTIALLY_PAID"
    else:
        bill.status = "PENDING"

    bill.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(bill)

    record_audit(
        db,
        action="UPDATE_BILL",
        user_id=current_user.id,
        entity_type="Bill",
        entity_id=bill.id,
    )

    notify_data_change("billing_updated", {"id": bill.id, "action": "updated"})
    return _map_bill_response(bill, db)


@router.post("/{bill_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    bill_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a payment towards a bill and update balance/status."""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    receipt_no = _generate_receipt_number(db)

    payment = Payment(
        bill_id=bill.id,
        receipt_number=receipt_no,
        amount=data.amount,
        payment_method=data.payment_method.upper(),
        transaction_reference=data.transaction_reference,
        note=data.note,
        received_by=current_user.id,
    )
    db.add(payment)

    # Recalculate bill balance
    new_paid = round(float(bill.paid_amount) + data.amount, 2)
    bill.paid_amount = new_paid
    bill.balance_amount = max(0.0, round(float(bill.total) - new_paid, 2))

    if bill.balance_amount <= 0.001:
        bill.status = "PAID"
    else:
        bill.status = "PARTIALLY_PAID"

    bill.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(payment)

    record_audit(
        db,
        action="RECORD_PAYMENT",
        user_id=current_user.id,
        entity_type="Payment",
        entity_id=payment.id,
    )

    notify_data_change("billing_updated", {"id": bill.id, "action": "payment_collected"})

    # Send payment notification
    target_uids = get_staff_user_ids(db)
    if bill.appointment and bill.appointment.doctor and bill.appointment.doctor.user_id:
        target_uids.append(bill.appointment.doctor.user_id)
    p_name = bill.patient.full_name if bill.patient else "Patient"
    create_system_notifications(
        db=db,
        user_ids=target_uids,
        title="Payment Received",
        message=f"₹{payment.amount:.2f} collected for {p_name} (Receipt {receipt_no}).",
        notif_type="PAYMENT",
        link_route="/reception/billing",
    )

    return _map_payment_response(payment, db)


@router.get("/payments/all", response_model=List[PaymentResponse])
def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List recent payments."""
    payments = db.query(Payment).order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()
    return [_map_payment_response(p, db) for p in payments]
