import {
  SocialMediaHeader,
  PartsListHeader,
  MidiPedalHeader,
} from './Notepad/headerComponents';

// Central configuration for all Notepad-based \"notes\" in the WinXP desktop.
// Each note can be opened from:
// - Desktop icons (via noteId)
// - Direct paths (via path)
// - Actions inside apps like Internet Explorer or Notepad headers

export const NOTES = [
  {
    id: 'thankYou',
    title: 'Thank You.txt',
    path: '/notes/thank-you',
    desktopIconTitle: 'Thank You.txt',
    headerComponent: SocialMediaHeader,
  },
  {
    id: 'guitarParts',
    title: 'Guitar Parts.txt',
    path: '/notes/guitar-parts',
    desktopIconTitle: 'Guitar Parts.txt',
    headerComponent: PartsListHeader,
  },
  {
    id: 'midiPedal',
    title: 'Midi Pedal.txt',
    path: '/notes/midi-pedal',
    desktopIconTitle: 'Midi Pedal.txt',
    headerComponent: MidiPedalHeader,
  },
];

export function getAllNotes() {
  return NOTES;
}

export function getNoteById(id) {
  return NOTES.find(note => note.id === id);
}

export function getNoteByPath(path) {
  return NOTES.find(note => note.path === path);
}
