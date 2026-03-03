from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)
DB_FILE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_FILE):
        conn = get_db_connection()
        # Create Tables
        conn.execute('''
            CREATE TABLE students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                total_fee REAL NOT NULL,
                paid_amount REAL NOT NULL
            )
        ''')
        # Insert Mock Data
        conn.execute('INSERT INTO students (name, email, subject, total_fee, paid_amount) VALUES (?, ?, ?, ?, ?)',
                     ('Emma Watson', 'emma.w@example.com', 'Mathematics 101', 1200.0, 1200.0))
        conn.execute('INSERT INTO students (name, email, subject, total_fee, paid_amount) VALUES (?, ?, ?, ?, ?)',
                     ('Liam Johnson', 'liam.j@example.com', 'Physics Adv', 1500.0, 800.0))
        conn.execute('INSERT INTO students (name, email, subject, total_fee, paid_amount) VALUES (?, ?, ?, ?, ?)',
                     ('Noah Williams', 'noah.w@example.com', 'Chemistry 101', 1000.0, 100.0))
        conn.commit()
        conn.close()

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/receipt/<int:id>')
def generate_receipt(id):
    conn = get_db_connection()
    student = conn.execute('SELECT * FROM students WHERE id = ?', (id,)).fetchone()
    conn.close()
    if student is None:
        return "Student not found", 404
    return render_template('receipt.html', student=student)

# --- APIs ---
@app.route('/api/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM students').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in students])

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO students (name, email, subject, total_fee, paid_amount) VALUES (?, ?, ?, ?, ?)',
                   (data['name'], data['email'], data['subject'], data['total_fee'], data['paid_amount']))
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': inserted_id, 'status': 'success'})

@app.route('/api/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM students WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
