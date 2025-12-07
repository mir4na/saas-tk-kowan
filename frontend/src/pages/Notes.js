import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notesAPI } from '../services/api';
import './Notes.css';

const Notes = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const saveTimeoutRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await notesAPI.getAll();
      setNotes(response.data.notes);
      if (response.data.notes.length > 0) {
        selectNote(response.data.notes[0]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectNote = (note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const createNewNote = async () => {
    try {
      const response = await notesAPI.create({
        title: 'Untitled Note',
        content: ''
      });
      const newNote = response.data.note;
      setNotes([newNote, ...notes]);
      selectNote(newNote);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const openDeleteModal = (noteId, e) => {
    if (e) e.stopPropagation();
    setNoteToDelete(noteId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      await notesAPI.delete(noteToDelete);
      const updatedNotes = notes.filter(n => n.id !== noteToDelete);
      setNotes(updatedNotes);

      if (selectedNote?.id === noteToDelete) {
        if (updatedNotes.length > 0) {
          selectNote(updatedNotes[0]);
        } else {
          setSelectedNote(null);
          setTitle('');
          setContent('');
        }
      }

      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting note:', error);
      closeDeleteModal();
    }
  };

  const saveNote = useCallback(async () => {
    if (!selectedNote) return;

    setSaving(true);
    try {
      const response = await notesAPI.update(selectedNote.id, {
        title: title || 'Untitled Note',
        content
      });

      // Update notes list
      setNotes(notes.map(n =>
        n.id === selectedNote.id ? response.data.note : n
      ));

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  }, [selectedNote, title, content, notes]);

  // Autosave logic - save 2 seconds after user stops typing
  useEffect(() => {
    if (selectedNote && (title !== selectedNote.title || content !== selectedNote.content)) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveNote();
      }, 2000); // Autosave after 2 seconds
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, selectedNote, saveNote]);

  if (loading) {
    return <div className="loading">Loading notes...</div>;
  }

  return (
    <div className="notes-container">
      {/* Sidebar */}
      <div className="notes-sidebar">
        <div className="sidebar-header">
          <h2>📝 NOTTU</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleBackToLanding} className="btn-back-landing" title="Back to Home">
              🏠
            </button>
            <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? '🌙' : '💚'}
            </button>
            <button onClick={createNewNote} className="btn-new-note">+ NEW</button>
          </div>
        </div>

        <div className="notes-list">
          {notes.length === 0 ? (
            <p className="empty-message">No notes yet. Create one!</p>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                onClick={() => selectNote(note)}
              >
                <h3>{note.title || 'Untitled Note'}</h3>
                <p>{note.content.substring(0, 60)}{note.content.length > 60 ? '...' : ''}</p>
                <small>{new Date(note.updated_at).toLocaleDateString()}</small>
                <button
                  onClick={(e) => openDeleteModal(note.id, e)}
                  className="btn-delete"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <span>{user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="notes-editor">
        {selectedNote ? (
          <>
            <div className="editor-header">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="title-input"
              />
              <div className="save-status">
                {saving ? (
                  <span className="saving">Saving...</span>
                ) : lastSaved ? (
                  <span className="saved">Saved {lastSaved.toLocaleTimeString()}</span>
                ) : null}
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing your note..."
              className="content-textarea"
            />
          </>
        ) : (
          <div className="empty-editor">
            <h2>No note selected</h2>
            <p>Select a note from the sidebar or create a new one.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Delete Note</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this note?</p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={closeDeleteModal} className="btn-cancel">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-confirm-delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
