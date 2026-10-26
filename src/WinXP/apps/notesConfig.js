import {
  SocialMediaHeader,
  PartsListHeader,
  MidiPedalHeader,
  NamAmpCaptureLinksHeader,
} from './Notepad/headerComponents';
import { notes } from 'content/site';

// Central configuration for all Notepad-based \"notes\" in the WinXP desktop.
// Each note can be opened from:
// - Desktop icons (via noteId)
// - Direct paths (via path)
// - Actions inside apps like Internet Explorer or Notepad headers

const headers = {
  thankYou: SocialMediaHeader,
  guitarParts: PartsListHeader,
  midiPedal: MidiPedalHeader,
  namAmpCaptureLinks: NamAmpCaptureLinksHeader,
};

export const NOTES = notes.map(note => ({
  ...note,
  desktopIconTitle: note.title,
  headerComponent: headers[note.id],
}));

export function getAllNotes() {
  return NOTES;
}

export function getNoteById(id) {
  return NOTES.find(note => note.id === id);
}

export function getNoteByPath(path) {
  return NOTES.find(note => note.path === path);
}
