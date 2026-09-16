# Security Specification for Personal Assistant App

## 1. Data Invariants
- Tasks: Must belong to the authenticated user (`userId == request.auth.uid`).
- Expenses: Must belong to the authenticated user (`userId == request.auth.uid`).
- Fields: All fields for Task and Expense must be strictly validated for type, length, and format.

## 2. The "Dirty Dozen" Payloads (for Task)
1. { "userId": "attacker", "description": "Poison", "week": "w1", "completed": false } (Spoofing userId)
2. { "userId": "me", "description": "Poison", "week": "w1", "completed": "string" } (Wrong type: completed)
3. { "userId": "me", "description": "", "week": "w1", "completed": false } (Empty description)
4. { "userId": "me", "description": "Valid", "week": "w1", "completed": false, "extra": "poison" } (Extra field)
5. { "userId": "me", "description": "Valid", "week": "w1" } (Missing required field: completed)
6. { "userId": "me", "description": "Valid", "week": "w1", "completed": false, "description_length": 5000 } (Long string)

(And 6 more for Expenses...)

## 3. The Test Runner (firestore.rules.test.ts)
... (to be generated) ...
