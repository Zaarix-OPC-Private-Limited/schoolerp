# Realtime Payload Contract (ERP)

This contract defines the exact WebSocket event format expected by frontend.

## Transport

- WebSocket URL: `ws://<host>/ws` or `wss://<host>/ws`
- Message format:

```json
{
  "event": "event-name",
  "payload": {}
}
```

`event` is mandatory. `payload` is mandatory.

## 1) attendance-updated

Used for both student and teacher attendance updates.

### Required fields

- `targetType`: `"student"` or `"teacher"`
- `date`: `"YYYY-MM-DD"`
- `finalStatus`: `"present"` | `"absent"` | `"sick_leave"` | `"leave"`

### Target identity

- For student:
  - `studentId` (required)
- For teacher:
  - `teacherId` (required)

### Optional fields

- `sourceUsed`: `"biometric"` | `"teacher_app"` | `"manual"`
- `biometricStatus`: `"present"` | `"absent"` | `"sick_leave"` | `"leave"` | `null`
- `teacherStatus`: `"present"` | `"absent"` | `"sick_leave"` | `null` (student flow)
- `manualStatus`: `"present"` | `"absent"` | `"leave"` | `null` (teacher flow)
- `updatedAt`: ISO datetime

### Student example

```json
{
  "event": "attendance-updated",
  "payload": {
    "targetType": "student",
    "studentId": "STD-006-A-081",
    "date": "2026-02-19",
    "finalStatus": "present",
    "sourceUsed": "biometric",
    "biometricStatus": "present",
    "teacherStatus": null,
    "updatedAt": "2026-02-19T09:11:22.000Z"
  }
}
```

### Teacher example

```json
{
  "event": "attendance-updated",
  "payload": {
    "targetType": "teacher",
    "teacherId": "T02",
    "date": "2026-02-19",
    "finalStatus": "absent",
    "sourceUsed": "manual",
    "biometricStatus": null,
    "manualStatus": "absent",
    "updatedAt": "2026-02-19T10:45:00.000Z"
  }
}
```

## 2) leave-updated

Used when leave request is created/updated (pending, approved, rejected).

### Required fields

- `id`: leave request id
- `requesterType`: `"student"` | `"teacher"` | `"staff"`
- `requesterName`
- `status`: `"pending"` | `"approved"` | `"rejected"`

### Optional fields

- `className`
- `rollNumber`
- `fromDate`: `"YYYY-MM-DD"`
- `toDate`: `"YYYY-MM-DD"`
- `reason`
- `parentContact`
- `requestedAt`

### Example

```json
{
  "event": "leave-updated",
  "payload": {
    "id": "LR-6A-ARAV-001",
    "requesterType": "student",
    "requesterName": "Atharv Bhatt",
    "className": "6th",
    "rollNumber": "081",
    "fromDate": "2026-02-18",
    "toDate": "2026-02-19",
    "reason": "Medical leave request from app",
    "parentContact": "9821000081",
    "status": "approved",
    "requestedAt": "2026-02-17 08:40"
  }
}
```

## 3) notice-sent

Used when head sends notice and system dispatches it.

### Required fields

- `id`: notice id
- `type`: notice type
- `audience`: `"all_school"` | `"students"` | `"teachers"` | `"staff"` | `"class_wise"`
- `subject`
- `count`: total recipients
- `channels`: `"WhatsApp"` | `"SMS"` | `"WhatsApp + SMS"`
- `timestamp`: display datetime string

### Optional fields

- `recipientLabel`: short display text (comma-separated names)
- `recipients`: array of recipients (for logs)

### Example

```json
{
  "event": "notice-sent",
  "payload": {
    "id": "NTC-20260219-001",
    "type": "performance",
    "audience": "teachers",
    "subject": "Class discipline review",
    "count": 1,
    "channels": "WhatsApp + SMS",
    "timestamp": "19/02/2026, 11:25:00 am",
    "recipientLabel": "Priya Sharma",
    "recipients": [
      {
        "id": "T02",
        "name": "Priya Sharma",
        "phone": "9899001102"
      }
    ]
  }
}
```

## Backend Notes

- Send one message per updated entity for `attendance-updated`.
- If bulk update is needed, emit multiple messages (preferred for simpler UI merge).
- Keep IDs stable and unique.
- Keep date format strict: `YYYY-MM-DD`.

