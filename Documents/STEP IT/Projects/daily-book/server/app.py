import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"]) # Enable credentials for Flask-Login
app.config['SECRET_KEY'] = 'your_secret_key' # Replace with a strong secret key
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dailybook.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login' # Redirect to login if not authenticated

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    diary_entries = db.relationship('DiaryEntry', backref='user', lazy=True)
    notes = db.relationship('Note', backref='user', lazy=True)
    reminders = db.relationship('Reminder', backref='user', lazy=True)
    todo_items = db.relationship('TodoItem', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {'id': self.id, 'username': self.username}

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class DiaryEntry(db.Model):
    date = db.Column(db.String(10), primary_key=True) # YYYY-MM-DD
    text = db.Column(db.Text, nullable=True)
    imageUrl = db.Column(db.String(255), nullable=True)
    tags = db.Column(db.Text, nullable=True) # Stored as JSON string
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)

    def to_dict(self):
        return {
            'date': self.date,
            'text': self.text,
            'imageUrl': self.imageUrl,
            'tags': json.loads(self.tags) if self.tags else []
        }

class Note(db.Model):
    date = db.Column(db.String(10), primary_key=True) # YYYY-MM-DD
    text = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)

    def to_dict(self):
        return {
            'date': self.date,
            'text': self.text
        }

class Reminder(db.Model):
    date = db.Column(db.String(10), primary_key=True) # YYYY-MM-DD
    text = db.Column(db.Text, nullable=True)
    time = db.Column(db.String(5), nullable=True) # HH:MM format
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)

    def to_dict(self):
        return {
            'date': self.date,
            'text': self.text,
            'time': self.time
        }

class TodoItem(db.Model):
    id = db.Column(db.String(36), primary_key=True) # UUID
    date = db.Column(db.String(10), nullable=False) # YYYY-MM-DD
    text = db.Column(db.String(255), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'text': self.text,
            'completed': self.completed
        }

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Authentication Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 409

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        return jsonify({'message': 'Logged in successfully', 'user': user.to_dict()}), 200
    return jsonify({'message': 'Invalid username or password'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/status', methods=['GET'])
def status():
    if current_user.is_authenticated:
        return jsonify({'is_authenticated': True, 'user': current_user.to_dict()})
    return jsonify({'is_authenticated': False})

# API Endpoints (Protected)
@app.route('/api/entries/<date>', methods=['GET'])
@login_required
def get_entry(date):
    entry = DiaryEntry.query.filter_by(date=date, user_id=current_user.id).first()
    if entry:
        return jsonify(entry.to_dict())
    return jsonify({'text': '', 'imageUrl': None, 'tags': []})

@app.route('/api/entries/<date>', methods=['POST'])
@login_required
def save_entry(date):
    text = request.form.get('text', '')
    file = request.files.get('image')
    tags_str = request.form.get('tags', '[]')
    try:
        tags = json.loads(tags_str)
    except json.JSONDecodeError:
        tags = []

    entry = DiaryEntry.query.filter_by(date=date, user_id=current_user.id).first()
    if not entry:
        entry = DiaryEntry(date=date, user_id=current_user.id)

    entry.text = text
    entry.tags = tags_str

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        entry.imageUrl = f'/uploads/{filename}'
    else:
        if not text and entry.imageUrl: # Clear image if text is cleared and image exists
             # Delete image file from server if it exists
            if entry.imageUrl and os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], entry.imageUrl.split('/')[-1])):
                 os.remove(os.path.join(app.config['UPLOAD_FOLDER'], entry.imageUrl.split('/')[-1]))
            entry.imageUrl = None
        # If text is present but no new image, keep old image path

    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict())

@app.route('/api/entries/last', methods=['GET'])
@login_required
def get_last_entry():
    entry = DiaryEntry.query.filter_by(user_id=current_user.id).order_by(DiaryEntry.date.desc()).first()
    if entry:
        return jsonify(entry.to_dict())
    return jsonify({'text': '', 'imageUrl': None, 'tags': [], 'date': None}) # Return empty dict if no entry


@app.route('/api/notes/<date>', methods=['GET'])
@login_required
def get_note(date):
    note = Note.query.filter_by(date=date, user_id=current_user.id).first()
    if note:
        return jsonify(note.to_dict())
    return jsonify({'text': ''})

@app.route('/api/notes/<date>', methods=['POST'])
@login_required
def save_note(date):
    data = request.get_json()
    note = Note.query.filter_by(date=date, user_id=current_user.id).first()
    if not note:
        note = Note(date=date, user_id=current_user.id)
    note.text = data.get('text', '')
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict())

@app.route('/api/reminders/<date>', methods=['GET'])
@login_required
def get_reminder(date):
    reminder = Reminder.query.filter_by(date=date, user_id=current_user.id).first()
    if reminder:
        return jsonify(reminder.to_dict())
    return jsonify({'text': '', 'time': None})

@app.route('/api/reminders/<date>', methods=['POST'])
@login_required
def save_reminder(date):
    data = request.get_json()
    reminder = Reminder.query.filter_by(date=date, user_id=current_user.id).first()
    if not reminder:
        reminder = Reminder(date=date, user_id=current_user.id)
    reminder.text = data.get('text', '')
    reminder.time = data.get('time', None)
    db.session.add(reminder)
    db.session.commit()
    return jsonify(reminder.to_dict())

@app.route('/api/todos/<date>', methods=['GET'])
@login_required
def get_todos(date):
    todos = TodoItem.query.filter_by(date=date, user_id=current_user.id).order_by(TodoItem.id).all()
    return jsonify([todo.to_dict() for todo in todos])

@app.route('/api/todos/<date>', methods=['POST'])
@login_required
def save_todos(date):
    data = request.get_json()
    
    # First, delete all existing todos for this date for the current user
    TodoItem.query.filter_by(date=date, user_id=current_user.id).delete()

    # Then, add the new ones
    for item_data in data:
        todo = TodoItem(
            id=item_data['id'],
            date=date,
            text=item_data['text'],
            completed=item_data['completed'],
            user_id=current_user.id
        )
        db.session.add(todo)
    
    db.session.commit()
    
    # Return the newly saved todos
    todos = TodoItem.query.filter_by(date=date, user_id=current_user.id).order_by(TodoItem.id).all()
    return jsonify([todo.to_dict() for todo in todos])

@app.route('/api/reminders/month/<int:year>/<int:month>', methods=['GET'])
@login_required
def get_reminders_for_month(year, month):
    # Construct date range for the month
    start_date = f"{year}-{month:02d}-01"
    # Get last day of the month
    if month == 12:
        end_date = f"{year+1}-01-01"
    else:
        end_date = f"{year}-{month+1:02d}-01"
    
    reminders = Reminder.query.filter(
        Reminder.user_id == current_user.id,
        Reminder.date >= start_date,
        Reminder.date < end_date
    ).all()
    
    return jsonify([r.to_dict() for r in reminders])

@app.route('/api/todos/month/<int:year>/<int:month>', methods=['GET'])
@login_required
def get_todos_for_month(year, month):
    # Construct date range for the month
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year+1}-01-01"
    else:
        end_date = f"{year}-{month+1:02d}-01"
    
    todos = TodoItem.query.filter(
        TodoItem.user_id == current_user.id,
        TodoItem.date >= start_date,
        TodoItem.date < end_date
    ).all()
    
    return jsonify([t.to_dict() for t in todos])

@app.route('/api/search', methods=['GET'])
@login_required
def search():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify([])

    search_results = []
    
    # Search Diary Entries
    diary_entries = DiaryEntry.query.filter(
        DiaryEntry.user_id == current_user.id,
        (DiaryEntry.text.ilike(f'%{query}%')) | (DiaryEntry.tags.ilike(f'%{query}%'))
    ).all()
    for entry in diary_entries:
        result = entry.to_dict()
        result['type'] = 'diary'
        search_results.append(result)

    # Search Notes
    notes = Note.query.filter(
        Note.user_id == current_user.id,
        Note.text.ilike(f'%{query}%')
    ).all()
    for note in notes:
        result = note.to_dict()
        result['type'] = 'note'
        search_results.append(result)

    # Search Reminders
    reminders = Reminder.query.filter(
        Reminder.user_id == current_user.id,
        Reminder.text.ilike(f'%{query}%')
    ).all()
    for reminder in reminders:
        result = reminder.to_dict()
        result['type'] = 'reminder'
        search_results.append(result)

    # Search Todo Items
    todos = TodoItem.query.filter(
        TodoItem.user_id == current_user.id,
        TodoItem.text.ilike(f'%{query}%')
    ).all()
    for todo in todos:
        result = todo.to_dict()
        result['type'] = 'todo'
        search_results.append(result)
            
    return jsonify(search_results)

@app.route('/api/tags', methods=['GET'])
@login_required
def get_all_tags():
    all_tags = set()
    diary_entries = DiaryEntry.query.filter_by(user_id=current_user.id).all()
    for entry in diary_entries:
        if entry.tags:
            try:
                tags_list = json.loads(entry.tags)
                for tag in tags_list:
                    all_tags.add(tag)
            except json.JSONDecodeError:
                continue
    return jsonify(sorted(list(all_tags)))

@app.route('/api/tags/rename', methods=['PUT'])
@login_required
def rename_tag():
    data = request.get_json()
    old_tag = data.get('old_tag')
    new_tag = data.get('new_tag')

    if not old_tag or not new_tag:
        return jsonify({'message': 'Old tag and new tag are required'}), 400
    if old_tag == new_tag:
        return jsonify({'message': 'New tag cannot be the same as old tag'}), 400

    diary_entries = DiaryEntry.query.filter_by(user_id=current_user.id).all()
    updated_count = 0
    for entry in diary_entries:
        if entry.tags:
            tags_list = json.loads(entry.tags)
            if old_tag in tags_list:
                tags_list.remove(old_tag)
                if new_tag not in tags_list: # Prevent duplicates if new_tag already exists
                    tags_list.append(new_tag)
                entry.tags = json.dumps(sorted(tags_list))
                db.session.add(entry)
                updated_count += 1
    db.session.commit()
    return jsonify({'message': f'Renamed {updated_count} occurrences of tag "{old_tag}" to "{new_tag}"'}), 200

@app.route('/api/tags/<string:tag_name>', methods=['DELETE'])
@login_required
def delete_tag(tag_name):
    diary_entries = DiaryEntry.query.filter_by(user_id=current_user.id).all()
    updated_count = 0
    for entry in diary_entries:
        if entry.tags:
            tags_list = json.loads(entry.tags)
            if tag_name in tags_list:
                tags_list.remove(tag_name)
                entry.tags = json.dumps(sorted(tags_list))
                db.session.add(entry)
                updated_count += 1
    db.session.commit()
    return jsonify({'message': f'Removed tag "{tag_name}" from {updated_count} entries'}), 200

@app.route('/api/diary_entries_filtered', methods=['GET'])
@login_required
def get_diary_entries_filtered():
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    sort_order = request.args.get('sort_order', 'desc') # 'asc' or 'desc'
    tags = request.args.get('tags', '').split(',') if request.args.get('tags') else []


    query = DiaryEntry.query.filter_by(user_id=current_user.id)

    if start_date_str:
        query = query.filter(DiaryEntry.date >= start_date_str)
    if end_date_str:
        query = query.filter(DiaryEntry.date <= end_date_str)
    if tags:
        for tag in tags:
            query = query.filter(DiaryEntry.tags.ilike(f'%"{tag}"%')) # Search for tag within JSON string

    if sort_order == 'asc':
        query = query.order_by(DiaryEntry.date.asc())
    else:
        query = query.order_by(DiaryEntry.date.desc())
    
    entries = query.all()
    return jsonify([entry.to_dict() for entry in entries])

@app.route('/api/notes_filtered', methods=['GET'])
@login_required
def get_notes_filtered():
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    sort_order = request.args.get('sort_order', 'desc')

    query = Note.query.filter_by(user_id=current_user.id)

    if start_date_str:
        query = query.filter(Note.date >= start_date_str)
    if end_date_str:
        query = query.filter(Note.date <= end_date_str)

    if sort_order == 'asc':
        query = query.order_by(Note.date.asc())
    else:
        query = query.order_by(Note.date.desc())
    
    notes = query.all()
    return jsonify([note.to_dict() for note in notes])

@app.route('/api/reminders_filtered', methods=['GET'])
@login_required
def get_reminders_filtered():
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    sort_order = request.args.get('sort_order', 'desc')

    query = Reminder.query.filter_by(user_id=current_user.id)

    if start_date_str:
        query = query.filter(Reminder.date >= start_date_str)
    if end_date_str:
        query = query.filter(Reminder.date <= end_date_str)

    if sort_order == 'asc':
        query = query.order_by(Reminder.date.asc())
    else:
        query = query.order_by(Reminder.date.desc())
    
    reminders = query.all()
    return jsonify([reminder.to_dict() for reminder in reminders])

@app.route('/api/todos_filtered', methods=['GET'])
@login_required
def get_todos_filtered():
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    sort_order = request.args.get('sort_order', 'desc')

    query = TodoItem.query.filter_by(user_id=current_user.id)

    if start_date_str:
        query = query.filter(TodoItem.date >= start_date_str)
    if end_date_str:
        query = query.filter(TodoItem.date <= end_date_str)

    if sort_order == 'asc':
        query = query.order_by(TodoItem.date.asc())
    else:
        query = query.order_by(TodoItem.date.desc())
    
    todos = query.all()
    return jsonify([todo.to_dict() for todo in todos])

@app.route('/api/export', methods=['GET'])
@login_required
def export_data():
    data_types = request.args.getlist('data_types') # e.g., ['diary', 'notes']
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    exported_data = {}

    def filter_by_date_range(query_obj, model):
        if start_date:
            query_obj = query_obj.filter(model.date >= start_date)
        if end_date:
            query_obj = query_obj.filter(model.date <= end_date)
        return query_obj

    if not data_types or 'diary_entries' in data_types:
        diary_entries_query = DiaryEntry.query.filter_by(user_id=current_user.id)
        diary_entries_query = filter_by_date_range(diary_entries_query, DiaryEntry)
        exported_data['diary_entries'] = [entry.to_dict() for entry in diary_entries_query.all()]

    if not data_types or 'notes' in data_types:
        notes_query = Note.query.filter_by(user_id=current_user.id)
        notes_query = filter_by_date_range(notes_query, Note)
        exported_data['notes'] = [note.to_dict() for note in notes_query.all()]

    if not data_types or 'reminders' in data_types:
        reminders_query = Reminder.query.filter_by(user_id=current_user.id)
        reminders_query = filter_by_date_range(reminders_query, Reminder)
        exported_data['reminders'] = [reminder.to_dict() for reminder in reminders_query.all()]

    if not data_types or 'todos' in data_types:
        todos_query = TodoItem.query.filter_by(user_id=current_user.id)
        todos_query = filter_by_date_range(todos_query, TodoItem)
        exported_data['todos'] = [todo.to_dict() for todo in todos_query.all()]

    return jsonify(exported_data)

@app.route('/api/import', methods=['POST'])
@login_required
def import_data():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file:
        try:
            imported_data = json.load(file)
            
            imported_count = {
                'diary_entries': 0,
                'notes': 0,
                'reminders': 0,
                'todos': 0,
            }

            # Import Diary Entries
            for item_data in imported_data.get('diary_entries', []):
                date_key = item_data.get('date')
                if not date_key: continue
                entry = DiaryEntry.query.filter_by(date=date_key, user_id=current_user.id).first()
                if not entry:
                    entry = DiaryEntry(date=date_key, user_id=current_user.id)
                entry.text = item_data.get('text', '')
                entry.imageUrl = item_data.get('imageUrl')
                entry.tags = json.dumps(item_data.get('tags', []))
                db.session.add(entry)
                imported_count['diary_entries'] += 1

            # Import Notes
            for item_data in imported_data.get('notes', []):
                date_key = item_data.get('date')
                if not date_key: continue
                note = Note.query.filter_by(date=date_key, user_id=current_user.id).first()
                if not note:
                    note = Note(date=date_key, user_id=current_user.id)
                note.text = item_data.get('text', '')
                db.session.add(note)
                imported_count['notes'] += 1

            # Import Reminders
            for item_data in imported_data.get('reminders', []):
                date_key = item_data.get('date')
                if not date_key: continue
                reminder = Reminder.query.filter_by(date=date_key, user_id=current_user.id).first()
                if not reminder:
                    reminder = Reminder(date=date_key, user_id=current_user.id)
                reminder.text = item_data.get('text', '')
                reminder.time = item_data.get('time', None)
                db.session.add(reminder)
                imported_count['reminders'] += 1

            # Import Todo Items
            for item_data in imported_data.get('todos', []):
                todo_id = item_data.get('id')
                date_key = item_data.get('date')
                if not todo_id or not date_key: continue
                todo = TodoItem.query.filter_by(id=todo_id, user_id=current_user.id).first()
                if not todo:
                    todo = TodoItem(id=todo_id, date=date_key, user_id=current_user.id)
                todo.text = item_data.get('text', '')
                todo.completed = item_data.get('completed', False)
                db.session.add(todo)
                imported_count['todos'] += 1

            db.session.commit()
            return jsonify({'message': 'Data imported successfully', 'imported_counts': imported_count}), 200

        except json.JSONDecodeError:
            return jsonify({'message': 'Invalid JSON file'}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'An error occurred during import: {str(e)}'}), 500
    return jsonify({'message': 'Something went wrong'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Ensure tables are created on app start
    app.run(port=5001)