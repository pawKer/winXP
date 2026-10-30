import { notes } from 'content/site';

export const NOTES = notes;

export function getAllNotes() {
  return NOTES;
}

export function getNoteById(id) {
  return NOTES.find(note => note.id === id);
}

export function getNoteByPath(path) {
  return NOTES.find(note => note.path === path);
}
