```
cd backend
```
```
python -m venv venv
```
```
venv\Scripts\activate
```
---
or
---
```
.\venv\Scripts\Activate.ps1
```
```
pip install -r requirements.txt
```
```
uvicorn main:app --reload --port 8000
uvicorn main:app --host 0.0.0.0 --port $PORT
```
```
deactivate
```