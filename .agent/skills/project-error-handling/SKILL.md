---
name: Project Error Handling & Safe Ops
description: Guide for using the standardized error handling utilities in `back/utils/safe_ops.py`.
---

# Project Error Handling Philosophy

We adhere to a standardized error handling strategy to minimize code duplication and ensure consistent logging across the backend.

## 1. Mandatory Usage of `safe_ops.py`
Before implementing any `try-except` block, file I/O, or HTTP request, you **MUST** check `back/utils/safe_ops.py`.

### Available Utilities
Use the following tools defined in `back/utils/safe_ops.py` instead of writing raw boilerplate:

- **JSON File Operations**:
  - `load_json_safe(file_path, default_data={})`: configuring safe read.
  - `save_json_safe(file_path, data)`: configuring safe write (auto-creates dirs).
  - `append_json_line(file_path, data)`: for JSONL logging.

- **HTTP Requests**:
  - `safe_http_get(url, headers)`: returns `(data, error_msg)`.

- **Context Manager (Block scope)**:
  - `with safe_execute("Context Description"):`: wraps a block implementation. Use this for risky logic blocks.

- **Decorators (Function scope)**:
  - `@handle_exceptions(default_message="...")`: For **Async** functions (especially FastAPI Routers).
  - `@handle_sync_exceptions(default_message="...")`: For **Sync** helper functions.

## 2. Fallback Rule (When `safe_ops` is insufficient)
If you encounter a situation where:
1. A specific exception needs to be handled differently (not just logged and suppressed/reported generically).
2. The existing `safe_ops` utilities do not cover the specific I/O or Logic case.
3. You feel tempted to write a raw `try-except` block that deviates from the project standard.

**ACTION REQUIRED:**
- **STOP**. Do not implement the raw `try-except` silently.
- **INFORM THE USER**:
  - Explain why `safe_ops.py` is insufficient for this specific case.
  - Propose whether to extend `safe_ops.py` or strict local handling is actually needed.

## 3. Implementation Example

**❌ Bad (Raw try-except):**
```python
# Don't do this
try:
    with open('data.json', 'r') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error: {e}")
```

**✅ Good (Using safe_ops):**
```python
from utils.safe_ops import load_json_safe

data = load_json_safe('data.json')
```

**✅ Good (Using Decorator):**
```python
from utils.safe_ops import handle_exceptions

@router.post("/generate")
@handle_exceptions(default_message="Generation Failed")
async def generate_something():
    ...
```
