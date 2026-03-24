import subprocess, sys, time, os

# Find and kill the old process on port 8000
import socket
try:
    import ctypes
except: pass

proc = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
for line in proc.stdout.splitlines():
    if ':8000 ' in line and 'LISTENING' in line:
        pid = line.strip().split()[-1]
        print('Found PID on 8000:', pid)
        subprocess.run(['taskkill', '/F', '/PID', pid], capture_output=True)
        print('Killed')
        time.sleep(1)
        break

# Start new server
venv_uvicorn = os.path.join(os.path.dirname(sys.executable), 'uvicorn.exe')
print('Starting server...')
p = subprocess.Popen([venv_uvicorn, 'main:app', '--reload', '--port', '8000'],
    cwd=r'd:\AI Assistant\EffortTracking\src\backend',
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print('Server PID:', p.pid)
