(() => {
  /* Reset session data on every page refresh. */
  try {
    [
      'touch-desktop-notes',
      'touch-desktop-puzzle-progress',
      'touch-desktop-wallpaper'
    ].forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Session data was not cleared.', error);
  }
  const desktop = document.getElementById('desktop');
  const taskItems = document.getElementById('taskItems');
  const startMenu = document.getElementById('startMenu');
  const startButton = document.getElementById('startButton');
  const sleepScreen = document.getElementById('sleepScreen');

  /* Windows 98 interface sound effects */
  const soundEffects = {
    click: new Audio('./Assets/SFX/windows-98-click.wav'),
    notify: new Audio('./Assets/SFX/windows-98-notify.wav'),
    startup: new Audio('./Assets/SFX/windows-98-start-up.wav')
  };

  Object.values(soundEffects).forEach(audio => {
    audio.preload = 'auto';
  });

  soundEffects.click.volume = 0.35;
  soundEffects.notify.volume = 0.65;
  soundEffects.startup.volume = 0.75;

  function playSoundEffect(name, restart = true) {
    const audio = soundEffects[name];
    if (!audio) return;

    try {
      if (restart) audio.currentTime = 0;
      const playback = audio.play();
      playback?.catch(() => {});
    } catch (error) {
      console.warn(`Could not play ${name} sound.`, error);
    }
  }

  document.addEventListener('click', event => {
    const control = event.target.closest('button, [role="button"], input[type="button"], input[type="submit"]');
    if (!control || control.disabled || control.closest('#loginScreen')) return;
    playSoundEffect('click');
  }, true);

  /* Login screen and connection mode */
  const loginScreen = document.getElementById('loginScreen');
  const loginOnline = document.getElementById('loginOnline');
  const loginOffline = document.getElementById('loginOffline');
  let sessionMode = null;

  function finishLogin(mode) {
    sessionMode = mode;
    document.body.dataset.sessionMode = mode;
    if (loginScreen) loginScreen.hidden = true;
    playSoundEffect('startup');
  }

  loginOnline?.addEventListener('click', () => finishLogin('online'));
  loginOffline?.addEventListener('click', () => finishLogin('offline'));

  let topZ = 20;

  const appIconClass = {
    viewerWindow: 'viewer-icon',
    computerWindow: 'computer-icon',
    musicWindow: 'disk-icon',
    mailWindow: 'mail-icon',
    keyPuzzleWindow: 'image-file-icon',
    paperViewerWindow: 'image-file-icon',
    aboutWindow: 'info-icon',
    aboutKeywordWindow: 'info-icon',
    aboutDownloadWindow: 'model-icon',
    notesWindow: 'notes-icon',
    puzzleFolderWindow: 'folder-icon',
    puzzleViewerWindow: 'image-file-icon',
    numberViewerWindow: 'image-file-icon',
    pictureWindow: 'picture-icon',
    triviaWindow: 'trivia-icon'
  };

  /*
   * Wallpaper settings
   */

  const wallpaperChoices = Array.from(
    document.querySelectorAll('.wallpaper-choice')
  );

  const wallpaperStatus = document.getElementById('wallpaperStatus');
  const resetWallpaperBtn = document.getElementById('resetWallpaperBtn');
  const wallpaperStorageKey = 'touch-desktop-wallpaper';

  const wallpaperClasses = [
    'wallpaper-daiko',
    'wallpaper-bg1',
    'wallpaper-bg2'
  ];

  function setWallpaper(name) {
    if (!desktop) return;

    desktop.classList.remove(...wallpaperClasses);

    let selectedName = name;

    switch (name) {
      case 'Background 1':
        desktop.classList.add('wallpaper-bg1');
        break;

      case 'Background 2':
        desktop.classList.add('wallpaper-bg2');
        break;

      case 'Daiko':
      default:
        selectedName = 'Daiko';
        desktop.classList.add('wallpaper-daiko');
        break;
    }

    wallpaperChoices.forEach(choice => {
      const active =
        choice.dataset.wallpaperName === selectedName;

      choice.classList.toggle('active', active);

      choice.setAttribute(
        'aria-pressed',
        active ? 'true' : 'false'
      );
    });

    if (wallpaperStatus) {
      wallpaperStatus.textContent =
        `Current wallpaper: ${selectedName}`;
    }

    try {
      localStorage.setItem(
        wallpaperStorageKey,
        selectedName
      );
    } catch (error) {
      console.warn('Wallpaper preference was not saved.', error);
    }
  }

  wallpaperChoices.forEach(choice => {
    choice.addEventListener('click', () => {
      const wallpaperName =
        choice.dataset.wallpaperName || 'Daiko';

      setWallpaper(wallpaperName);
    });
  });

  resetWallpaperBtn?.addEventListener('click', () => {
    setWallpaper('Daiko');
  });

  let savedWallpaper = 'Daiko';

  try {
    savedWallpaper =
      localStorage.getItem(wallpaperStorageKey) ||
      'Daiko';
  } catch (error) {
    console.warn('Wallpaper preference was not loaded.', error);
  }

  const savedWallpaperExists = wallpaperChoices.some(
    choice =>
      choice.dataset.wallpaperName === savedWallpaper
  );

  setWallpaper(
    savedWallpaperExists ? savedWallpaper : 'Daiko'
  );

  /*
   * Window management
   */

  function focusWindow(win) {
    if (!win) return;

    document
      .querySelectorAll('.app-window')
      .forEach(item => {
        item.classList.remove('is-active');
      });

    win.classList.add('is-active');
    win.style.zIndex = String(++topZ);

    document
      .querySelectorAll('.task-item')
      .forEach(item => {
        item.classList.toggle(
          'active',
          item.dataset.task === win.id
        );
      });
  }

  function ensureTaskItem(win) {
    if (!taskItems || !win) return null;

    let task = taskItems.querySelector(
      `[data-task="${win.id}"]`
    );

    if (task) {
      task.hidden = false;
      return task;
    }

    task = document.createElement('button');
    task.type = 'button';
    task.className = 'task-item active';
    task.dataset.task = win.id;

    const icon = document.createElement('span');

    icon.className =
      `task-app-icon ${appIconClass[win.id] || ''}`;


    const label = document.createElement('span');

    label.textContent =
      win.dataset.app ||
      win.querySelector('.window-title span:last-child')
        ?.textContent ||
      'App';

    task.append(icon, label);
    taskItems.append(task);

    return task;
  }

  function openWindow(id) {
    const win = document.getElementById(id);

    if (!win) return;

    win.hidden = false;
    win.classList.remove('is-minimized');

    ensureTaskItem(win);
    focusWindow(win);

    if (startMenu) {
      startMenu.hidden = true;
    }

    startButton?.classList.remove('open');
  }

  function closeWindow(win) {
    if (!win) return;

    win.hidden = true;

    win.classList.remove(
      'is-minimized',
      'is-active',
      'is-maximized'
    );

    taskItems
      ?.querySelector(`[data-task="${win.id}"]`)
      ?.remove();
  }

  function minimizeWindow(win) {
    if (!win) return;

    win.classList.add('is-minimized');
    win.classList.remove('is-active');

    taskItems
      ?.querySelector(`[data-task="${win.id}"]`)
      ?.classList.remove('active');
  }

  function toggleMaximize(win) {
    if (!win) return;

    win.classList.toggle('is-maximized');
    focusWindow(win);
  }

  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-open]');

    if (opener) {
      openWindow(opener.dataset.open);
      return;
    }

    const task = event.target.closest('[data-task]');

    if (task) {
      const win = document.getElementById(
        task.dataset.task
      );

      if (!win) return;

      if (
        win.classList.contains('is-minimized') ||
        win.hidden
      ) {
        openWindow(win.id);
      } else if (win.classList.contains('is-active')) {
        minimizeWindow(win);
      } else {
        focusWindow(win);
      }

      return;
    }

    const control = event.target.closest(
      '[data-window-action]'
    );

    if (control) {
      const win = control.closest('.app-window');
      const action = control.dataset.windowAction;

      if (action === 'close') {
        closeWindow(win);
      }

      if (action === 'minimize') {
        minimizeWindow(win);
      }

      if (action === 'maximize') {
        toggleMaximize(win);
      }
    }
  });

  /*
   * Start menu
   */

  startButton?.addEventListener('click', event => {
    event.stopPropagation();

    if (!startMenu) return;

    startMenu.hidden = !startMenu.hidden;

    startButton.classList.toggle(
      'open',
      !startMenu.hidden
    );
  });

  startMenu?.addEventListener('click', event => {
    event.stopPropagation();

    const appButton = event.target.closest('[data-open]');

    if (appButton && startMenu.contains(appButton)) {
      openWindow(appButton.dataset.open);
    }
  });

  document.addEventListener('click', () => {
    if (startMenu) {
      startMenu.hidden = true;
    }

    startButton?.classList.remove('open');
  });

  /*
   * Dragging and resizing windows
   */

  document
    .querySelectorAll('.app-window')
    .forEach(win => {
      win.addEventListener('pointerdown', () => {
        if (!win.hidden) {
          focusWindow(win);
        }
      });

      const dragHandle = win.querySelector(
        '[data-drag-handle]'
      );

      dragHandle?.addEventListener(
        'pointerdown',
        event => {
          if (
            event.target.closest('button') ||
            win.classList.contains('is-maximized')
          ) {
            return;
          }

          event.preventDefault();

          const rect = win.getBoundingClientRect();
          const startX = event.clientX;
          const startY = event.clientY;

          function moveWindow(moveEvent) {
            const nextX =
              rect.left +
              moveEvent.clientX -
              startX;

            const nextY =
              rect.top +
              moveEvent.clientY -
              startY;

            const maxX =
              window.innerWidth -
              Math.min(rect.width, window.innerWidth);

            const taskbarHeight = 46;

            const maxY =
              window.innerHeight -
              taskbarHeight -
              30;

            win.style.setProperty(
              '--x',
              `${Math.max(0, Math.min(nextX, maxX))}px`
            );

            win.style.setProperty(
              '--y',
              `${Math.max(0, Math.min(nextY, maxY))}px`
            );
          }

          function stopMoving() {
            window.removeEventListener(
              'pointermove',
              moveWindow
            );

            window.removeEventListener(
              'pointerup',
              stopMoving
            );
          }

          window.addEventListener(
            'pointermove',
            moveWindow
          );

          window.addEventListener(
            'pointerup',
            stopMoving
          );
        }
      );

      const resizeHandle = win.querySelector(
        '[data-resize-handle]'
      );

      resizeHandle?.addEventListener(
        'pointerdown',
        event => {
          if (win.classList.contains('is-maximized')) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          const rect = win.getBoundingClientRect();
          const startX = event.clientX;
          const startY = event.clientY;

          function resizeWindow(moveEvent) {
            const width =
              rect.width +
              moveEvent.clientX -
              startX;

            const height =
              rect.height +
              moveEvent.clientY -
              startY;

            const maxWidth =
              window.innerWidth - rect.left;

            const maxHeight =
              window.innerHeight -
              rect.top -
              46;

            win.style.setProperty(
              '--w',
              `${Math.max(
                360,
                Math.min(width, maxWidth)
              )}px`
            );

            win.style.setProperty(
              '--h',
              `${Math.max(
                260,
                Math.min(height, maxHeight)
              )}px`
            );
          }

          function stopResizing() {
            window.removeEventListener(
              'pointermove',
              resizeWindow
            );

            window.removeEventListener(
              'pointerup',
              stopResizing
            );
          }

          window.addEventListener(
            'pointermove',
            resizeWindow
          );

          window.addEventListener(
            'pointerup',
            stopResizing
          );
        }
      );
    });

  /*
   * Sleep screen
   */

  document
    .getElementById('sleepButton')
    ?.addEventListener('click', () => {
      if (sleepScreen) {
        sleepScreen.hidden = false;
      }
    });

  sleepScreen?.addEventListener('click', () => {
    sleepScreen.hidden = true;
  });

  /*
   * Clock
   */

  const clock = document.getElementById('clock');

  function updateClock() {
    if (!clock) return;

    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });

    const date = now.toLocaleDateString();

    clock.textContent = `${time}\n${date}`;
  }

  updateClock();
  setInterval(updateClock, 1000);



  /*
   * Notes app
   */

  const notesStorageKey = 'touch-desktop-notes';
  const lockedNoteId = 'system-model-clue';
  const lockedNote = {
    id: lockedNoteId,
    title: 'Pinned Note',
    body: 'Take what the numbers ask for. \nFive numbers.\nEach number knows where to look.\nRead what they leave behind.\n\n-----------------------------------------------------\n\nDREAM\nRADIO\nDUST\nWAVE\nHELLO',
    updatedAt: 946684800000,
    locked: true
  };

  const notesList = document.getElementById('notesList');
  const noteTitle = document.getElementById('noteTitle');
  const noteBody = document.getElementById('noteBody');
  const noteSaveStatus = document.getElementById('noteSaveStatus');
  const noteErrorWindow = document.getElementById('noteErrorWindow');
  const dismissNoteError = document.getElementById('dismissNoteError');
  let notes = [];
  let activeNoteId = null;
  let noteSaveTimer = null;

  function makeNote() {
    const now = Date.now();
    return { id: String(now), title: 'Untitled note', body: '', updatedAt: now };
  }

  function enforceLockedNote() {
    notes = notes.filter(note => note?.id !== lockedNoteId);
    notes.push({ ...lockedNote });
  }

  function showNoteError() {
    if (!noteErrorWindow) return;
    noteErrorWindow.hidden = false;
    noteErrorWindow.classList.remove('is-minimized');
    focusWindow(noteErrorWindow);
    dismissNoteError?.focus();
  }

  function closeNoteError() {
    if (!noteErrorWindow) return;
    noteErrorWindow.hidden = true;
    noteErrorWindow.classList.remove('is-active');
    focusWindow(document.getElementById('notesWindow'));
  }

  dismissNoteError?.addEventListener('click', closeNoteError);

  function loadNotes() {
    try {
      const stored = JSON.parse(localStorage.getItem(notesStorageKey) || '[]');
      notes = Array.isArray(stored) ? stored : [];
    } catch {
      notes = [];
    }

    enforceLockedNote();
    activeNoteId = lockedNoteId;
    saveNotes();
    renderNotes();
    loadActiveNote();
  }

  function saveNotes() {
    enforceLockedNote();
    localStorage.setItem(notesStorageKey, JSON.stringify(notes));
    if (noteSaveStatus) noteSaveStatus.textContent = 'Saved';
  }

  function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = '';

    [...notes]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach(note => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'note-list-item';
        button.classList.toggle('active', note.id === activeNoteId);
        button.classList.toggle('locked-note', note.id === lockedNoteId);

        const title = document.createElement('span');
        title.className = 'note-list-title';
        title.textContent = `${note.id === lockedNoteId ? ' ' : ''}${note.title.trim() || 'Untitled note'}`;

        const date = document.createElement('span');
        date.className = 'note-list-date';
        date.textContent = note.id === lockedNoteId
          ? 'System file'
          : new Date(note.updatedAt).toLocaleString([], {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
            });

        button.append(title, date);
        button.addEventListener('click', () => {
          activeNoteId = note.id;
          renderNotes();
          loadActiveNote();
        });
        notesList.append(button);
      });
  }

  function loadActiveNote() {
    const note = notes.find(item => item.id === activeNoteId);
    if (!note) return;
    const isLocked = note.id === lockedNoteId;
    if (noteTitle) {
      noteTitle.value = note.title;
      noteTitle.readOnly = isLocked;
    }
    if (noteBody) {
      noteBody.value = note.body;
      noteBody.readOnly = isLocked;
    }
    if (noteSaveStatus) noteSaveStatus.textContent = isLocked ? 'Read only' : 'Saved';
  }

  function updateActiveNote() {
    const note = notes.find(item => item.id === activeNoteId);
    if (!note) return;
    if (note.id === lockedNoteId) {
      loadActiveNote();
      showNoteError();
      return;
    }
    note.title = noteTitle?.value || 'Untitled note';
    note.body = noteBody?.value || '';
    note.updatedAt = Date.now();
    if (noteSaveStatus) noteSaveStatus.textContent = 'Saving...';
    renderNotes();
    clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(saveNotes, 350);
  }

  noteTitle?.addEventListener('input', updateActiveNote);
  noteBody?.addEventListener('input', updateActiveNote);

  document.getElementById('newNoteBtn')?.addEventListener('click', () => {
    const note = makeNote();
    notes.unshift(note);
    activeNoteId = note.id;
    saveNotes();
    renderNotes();
    loadActiveNote();
    noteTitle?.focus();
    noteTitle?.select();
  });

  document.getElementById('deleteNoteBtn')?.addEventListener('click', () => {
    if (!activeNoteId) return;
    if (activeNoteId === lockedNoteId) {
      showNoteError();
      return;
    }
    notes = notes.filter(note => note.id !== activeNoteId);
    enforceLockedNote();
    activeNoteId = notes[0]?.id || lockedNoteId;
    saveNotes();
    renderNotes();
    loadActiveNote();
  });

  loadNotes();

  /*
   * Music player
   */

  const audio = document.getElementById('audioPlayer');
  const playlist = document.getElementById('playlist');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const seekBar = document.getElementById('seekBar');
  const volumeBar = document.getElementById('volumeBar');
  const trackTitle = document.getElementById('trackTitle');
  const trackMeta = document.getElementById('trackMeta');
  const currentTimeText = document.getElementById('currentTime');
  const durationText = document.getElementById('duration');
  const musicCodeInput = document.getElementById('musicCodeInput');
  const addMusicBtn = document.getElementById('addMusicBtn');
  const musicCodeMessage = document.getElementById('musicCodeMessage');
  let recoveredTrackUnlocked = false;

  const tracks = [
    {
      title: 'signal',
      artist: 'Unknown recording',
      url: './Assets/Music/morse.mp3',
      puzzleTrack: true
    },
    {
      title: 'Hello cro',
      artist: 'Varra',
      url: './Assets/Music/Hello cro - Varra.mp3'
    },
    {
      title: 'Icube',
      artist: 'Adore',
      url: './Assets/Music/Icube - Adore.mp3'
    },
    {
      title: 'Nome Da Musica',
      artist: 'Windows 96',
      url: './Assets/Music/Nome Da Musica - Windows 96.mp3'
    },
    {
      title: 'People Net',
      artist: 'Ellktro',
      url: './Assets/Music/People Net - Ellktro.mp3'
    },
    {
      title: 'Returns to the Orange Grove',
      artist: 'Brokeback',
      url: './Assets/Music/Returns to the Orange Grove - Brokeback.mp3'
    },
    {
      title: 'Stone In Focus',
      artist: 'Benoit Pioulard',
      url: './Assets/Music/Stone In Focus - Benoit Pioulard.mp3'
    },
    {
      title: 'Dark And Long - Dark Train',
      artist: 'Underworld',
      url: './Assets/Music/Dark And Long - Dark Train - Underworld.mp3'
    }
  ];

  let currentIndex = 0;
  let shuffle = false;

  function unlockRecoveredTrack() {
    if (recoveredTrackUnlocked) {
      if (musicCodeMessage) musicCodeMessage.textContent = 'The recovered recording is already in the playlist.';
      return;
    }

    const enteredCode = (musicCodeInput?.value || '').replace(/\D/g, '');
    if (enteredCode !== '1788') {
      if (musicCodeMessage) musicCodeMessage.textContent = 'No matching recording found.';
      musicCodeInput?.select();
      return;
    }

    recoveredTrackUnlocked = true;
    tracks.push({
      title: 'Phone Call',
      artist: 'Recovered file',
      url: './Assets/Music/message.mp3',
      recoveredClue: true
    });

    if (musicCodeMessage) musicCodeMessage.textContent = '1 hidden recording found.';
    if (musicCodeInput) {
      musicCodeInput.value = '1788';
      musicCodeInput.disabled = true;
    }
    if (addMusicBtn) addMusicBtn.disabled = true;
    renderPlaylist();
    loadTrack(tracks.length - 1, true);
  }

  addMusicBtn?.addEventListener('click', unlockRecoveredTrack);
  musicCodeInput?.addEventListener('input', () => {
    musicCodeInput.value = musicCodeInput.value.replace(/\D/g, '').slice(0, 4);
    if (musicCodeMessage && !recoveredTrackUnlocked) {
      musicCodeMessage.textContent = 'Enter the four-number recording code.';
    }
  });
  musicCodeInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') unlockRecoveredTrack();
  });

  function renderPlaylist() {
    if (!playlist) return;

    playlist.innerHTML = '';

    tracks.forEach((track, index) => {
      const item = document.createElement('li');
      const number = document.createElement('span');
      const details = document.createElement('span');
      const title = document.createElement('strong');
      const artist = document.createElement('small');

      number.textContent = String(index + 1).padStart(2, '0');
      number.className = 'track-number';

      title.textContent = track.title;
      artist.textContent = track.artist;
      details.className = 'track-details';
      details.append(title, artist);

      item.append(number, details);
      item.classList.toggle('active', index === currentIndex);

      item.addEventListener('click', () => {
        loadTrack(index, true);
      });

      playlist.append(item);
    });
  }

  function loadTrack(index, autoplay = false) {
    if (!audio || !tracks[index]) return;

    currentIndex = index;
    const track = tracks[index];

    audio.src = track.url;
    audio.load();

    if (trackTitle) trackTitle.textContent = track.title;
    if (trackMeta) {
      trackMeta.textContent = track.recoveredClue
        ? 'Recovered message: THE FOURTH LETTER IS A'
        : track.artist;
    }

    if (seekBar) seekBar.value = '0';
    if (currentTimeText) currentTimeText.textContent = '0:00';
    if (durationText) durationText.textContent = '0:00';

    renderPlaylist();

    if (autoplay) {
      audio.play().catch(error => {
        console.warn('Audio playback failed.', error);
      });
    }
  }

  function nextTrack() {
    if (tracks.length === 0) return;

    let nextIndex;

    if (shuffle && tracks.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }

    loadTrack(nextIndex, true);
  }

  function previousTrack() {
    if (tracks.length === 0) return;

    const previousIndex =
      (currentIndex - 1 + tracks.length) % tracks.length;

    loadTrack(previousIndex, true);
  }

  playPauseBtn?.addEventListener('click', () => {
    if (!audio || tracks.length === 0) return;

    if (!audio.src) loadTrack(currentIndex, false);

    if (audio.paused) {
      audio.play().catch(error => {
        console.warn('Audio playback failed.', error);
      });
    } else {
      audio.pause();
    }
  });

  const previousBtn = document.getElementById('previousBtn');
  let previousClickTimer = null;

  function restartCurrentTrack() {
    if (!audio || tracks.length === 0) return;

    if (!audio.src) {
      loadTrack(currentIndex, true);
      return;
    }

    audio.currentTime = 0;
    audio.play().catch(error => {
      console.warn('Audio playback failed.', error);
    });
  }

  previousBtn?.addEventListener('click', () => {
    clearTimeout(previousClickTimer);
    previousClickTimer = setTimeout(() => {
      restartCurrentTrack();
      previousClickTimer = null;
    }, 250);
  });

  previousBtn?.addEventListener('dblclick', () => {
    clearTimeout(previousClickTimer);
    previousClickTimer = null;
    previousTrack();
  });

  document.getElementById('nextBtn')
    ?.addEventListener('click', nextTrack);

  shuffleBtn?.addEventListener('click', () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle('active', shuffle);
    shuffleBtn.setAttribute('aria-pressed', shuffle ? 'true' : 'false');
  });

  audio?.addEventListener('play', () => {
    if (playPauseBtn) {
      playPauseBtn.textContent = '❚❚';
      playPauseBtn.title = 'Pause';
    }
  });

  audio?.addEventListener('pause', () => {
    if (playPauseBtn) {
      playPauseBtn.textContent = '▶';
      playPauseBtn.title = 'Play';
    }
  });

  audio?.addEventListener('ended', nextTrack);

  audio?.addEventListener('loadedmetadata', () => {
    if (durationText) {
      durationText.textContent = formatTime(audio.duration);
    }
  });

  audio?.addEventListener('error', () => {
    if (trackMeta) {
      trackMeta.textContent = 'Audio file missing from Assets/Music';
    }
  });

  audio?.addEventListener('timeupdate', () => {
    const progress = audio.duration
      ? audio.currentTime / audio.duration
      : 0;

    if (seekBar) seekBar.value = String(progress * 100);
    if (currentTimeText) {
      currentTimeText.textContent = formatTime(audio.currentTime);
    }
    if (durationText) {
      durationText.textContent = formatTime(audio.duration);
    }
  });

  seekBar?.addEventListener('input', () => {
    if (!audio?.duration) return;
    audio.currentTime = Number(seekBar.value) / 100 * audio.duration;
  });

  volumeBar?.addEventListener('input', () => {
    if (audio) audio.volume = Number(volumeBar.value);
  });

  if (audio) audio.volume = Number(volumeBar?.value || 0.2);

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  }

  renderPlaylist();
  loadTrack(0, false);

  /*
   * Picture slideshow and draggable fish puzzle
   */

  const pictureSlides = Array.from(document.querySelectorAll('[data-picture-slide]'));
  const picturePrevious = document.getElementById('picturePrevious');
  const pictureNext = document.getElementById('pictureNext');
  const pictureCounter = document.getElementById('pictureCounter');
  const pictureStage = document.getElementById('pictureStage');
  const pictureZoomOut = document.getElementById('pictureZoomOut');
  const pictureZoomIn = document.getElementById('pictureZoomIn');
  const pictureZoomValue = document.getElementById('pictureZoomValue');
  let currentPictureIndex = 0;
  let pictureZoom = 1;
  const pictureZoomStep = 0.25;
  const pictureZoomMin = 0.5;
  const pictureZoomMax = 2.5;

  function updatePictureZoom() {
    if (pictureStage) {
      pictureStage.style.setProperty('--picture-zoom', pictureZoom);
    }

    if (pictureZoomValue) {
      pictureZoomValue.textContent = `${Math.round(pictureZoom * 100)}%`;
    }

    if (pictureZoomOut) {
      pictureZoomOut.disabled = pictureZoom <= pictureZoomMin;
    }

    if (pictureZoomIn) {
      pictureZoomIn.disabled = pictureZoom >= pictureZoomMax;
    }
  }

function showPictureSlide(index) {
  if (!pictureSlides.length) return;

  currentPictureIndex =
    (index + pictureSlides.length) % pictureSlides.length;

  pictureSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle(
      'active',
      slideIndex === currentPictureIndex
    );
  });

  if (pictureCounter) {
    const activeSlide = pictureSlides[currentPictureIndex];
    const customName = activeSlide.dataset.slideName;

    pictureCounter.textContent = customName
      ? customName
      : `${currentPictureIndex + 1} / ${pictureSlides.length}`;
  }
}
  picturePrevious?.addEventListener('click', () => {
    showPictureSlide(currentPictureIndex - 1);
  });

  pictureNext?.addEventListener('click', () => {
    showPictureSlide(currentPictureIndex + 1);
  });

  pictureZoomOut?.addEventListener('click', () => {
    pictureZoom = Math.max(pictureZoomMin, pictureZoom - pictureZoomStep);
    updatePictureZoom();
  });

  pictureZoomIn?.addEventListener('click', () => {
    pictureZoom = Math.min(pictureZoomMax, pictureZoom + pictureZoomStep);
    updatePictureZoom();
  });

  updatePictureZoom();

  function enablePicturePieceDragging(piece) {
    const slide = piece.closest('.fish-puzzle-canvas, .daisy-puzzle-canvas');
    if (!slide) return;

    let dragging = false;
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;

    piece.addEventListener('pointerdown', event => {
      dragging = true;
      piece.setPointerCapture(event.pointerId);

      const pieceBox = piece.getBoundingClientRect();
      pointerOffsetX = event.clientX - pieceBox.left;
      pointerOffsetY = event.clientY - pieceBox.top;
      piece.classList.add('is-dragging');
      event.preventDefault();
    });

    piece.addEventListener('pointermove', event => {
      if (!dragging) return;

      const slideBox = slide.getBoundingClientRect();
      const pieceBox = piece.getBoundingClientRect();
      const maxLeft = Math.max(0, slideBox.width - pieceBox.width);
      const maxTop = Math.max(0, slideBox.height - pieceBox.height);
      const left = Math.min(maxLeft, Math.max(0, event.clientX - slideBox.left - pointerOffsetX));
      const top = Math.min(maxTop, Math.max(0, event.clientY - slideBox.top - pointerOffsetY));

      const leftPercent = slideBox.width ? (left / slideBox.width) * 100 : 0;
      const topPercent = slideBox.height ? (top / slideBox.height) * 100 : 0;

      piece.style.left = `${leftPercent}%`;
      piece.style.top = `${topPercent}%`;
      piece.style.right = 'auto';
      piece.style.bottom = 'auto';
    });

    const stopDragging = event => {
      if (!dragging) return;
      dragging = false;
      piece.classList.remove('is-dragging');
      if (piece.hasPointerCapture(event.pointerId)) piece.releasePointerCapture(event.pointerId);
    };

    piece.addEventListener('pointerup', stopDragging);
    piece.addEventListener('pointercancel', stopDragging);
  }

  document.querySelectorAll('.draggable-fish, .draggable-daisy-cover').forEach(enablePicturePieceDragging);
  showPictureSlide(0);

  /*
   * Puzzle folder and image viewer
   */

  const puzzleViewerImage = document.getElementById('puzzleViewerImage');
  const puzzleViewerTitle = document.getElementById('puzzleViewerTitle');
  const puzzleViewerWindow = document.getElementById('puzzleViewerWindow');

  document.querySelectorAll('[data-puzzle-src]').forEach(fileButton => {
    fileButton.addEventListener('click', () => {
      const src = fileButton.dataset.puzzleSrc;
      const title = fileButton.dataset.puzzleTitle || 'Puzzle';

      if (puzzleViewerImage) {
        puzzleViewerImage.src = src;
        puzzleViewerImage.alt = title;
      }

      if (puzzleViewerTitle) {
        puzzleViewerTitle.textContent = title;
      }

      if (puzzleViewerWindow) {
        puzzleViewerWindow.dataset.app = title;
      }

      if (puzzleMap) {
        puzzleMap.classList.toggle('static-puzzle', fileButton.dataset.puzzleStatic === 'true');
      }

      openWindow('puzzleViewerWindow');
    });
  });

  /*
   * Interactive puzzle trivia
   */

  const puzzleMap = document.getElementById('puzzleMap');
  const hotspotToggle = document.getElementById('hotspotToggle');
  const resetPuzzleProgress = document.getElementById('resetPuzzleProgress');
  const triviaWindowTitle = document.getElementById('triviaWindowTitle');
  const triviaQuestion = document.getElementById('triviaQuestion');
  const triviaAnswers = document.getElementById('triviaAnswers');
  const triviaMessage = document.getElementById('triviaMessage');
  const triviaProgress = document.getElementById('triviaProgress');
  const triviaLockout = document.getElementById('triviaLockout');
  const triviaCountdown = document.getElementById('triviaCountdown');

  if (hotspotToggle) hotspotToggle.checked = false;
  puzzleMap?.classList.remove('show-hotspots');

  const puzzleQuestions = {
    red: {
      title: 'Red Line',
      question: 'Open Computer Specifications. What processor is installed in this workstation?',
      answers: [
        'intel pentium 333',
        'pentium 333',
        'intel pentium 333',
        'pentium 333'
      ],
      displayAnswer: 'Intel Pentium 333',
      pathPart: '/archive/',
      hints: [
        'Check the Computer Specifications.', 
      ]
    },
    yellow: {
      title: 'Yellow Line',
      question: 'According to Computer Specifications, how much memory does this workstation have?',
      answers: ['64 mb sdram', '64mb sdram', '64 mb', '64mb', '64'],
      displayAnswer: '64 MB SDRAM',
      pathPart: 'main-terminal/',
      hints: [
        'Check Computer Specifications.',
      ]
    },
    orange: {
      title: 'Orange Line',
      question: 'Open Picture and go to the second image. What flower is shown?',
      answers: ['daisy', 'a daisy', 'daisy flower', 'a daisy flower'],
      displayAnswer: 'Daisy',
      pathPart: 'recovery/',
      hints: [
        'Check Picture.',
      ]
    },
    green: {
      title: 'Green Line · Number Cipher',
      question: `14, 1, 13, 5
15, 6
20, 8, 5  
15, 19`,
      answers: ['labyrinth os', 'labyrinthos', 'labyrinth', 'labyrinth os 1.0', 'labyrinthos1.0'],
      displayAnswer: 'LABYRINTH OS',
      pathPart: 'identity/confirmed/',
      hints: [
        'Alphabetic letters means something else.',
      ]
    },
    white: {
      title: 'Final Station',
      question: 'I have a brain but no thoughts.\nI have memory but no past.\nI have a flower but no garden.\nI run but never walk.\n\nWhat am I?',
      answers: ['computer', 'a computer', 'the computer', 'pc', 'a pc', 'the pc', 'workstation', 'a workstation', 'the workstation'],
      displayAnswer: 'Computer',
      hints: [
        'Each line points back to something you used on this desktop.',
        'It has a processor, memory, pictures, and an operating system.'
      ],
      final: true
    }
  };

  const requiredPuzzleKeys = ['red', 'yellow', 'orange', 'green'];
  const completedPuzzles = new Set();
  const puzzleAttempts = new Map();

  function normalizePuzzleAnswer(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[\u2010-\u2015_-]+/g, ' ')
      .replace(/[^a-z0-9 ]+/g, '')
      .replace(/\s+/g, ' ');
  }

  function updatePuzzleProgress() {
    const count = requiredPuzzleKeys.filter(key => completedPuzzles.has(key)).length;
    if (triviaProgress) triviaProgress.textContent = `Completed: ${count} / 4`;

    puzzleMap?.querySelectorAll('.puzzle-hotspot').forEach(hotspot => {
      hotspot.classList.toggle('is-complete', completedPuzzles.has(hotspot.dataset.puzzle));
    });
  }

  function allRegularPuzzlesComplete() {
    return requiredPuzzleKeys.every(key => completedPuzzles.has(key));
  }

  function showPuzzleMessage(message, type = '') {
    if (!triviaMessage) return;
    triviaMessage.textContent = message;
    triviaMessage.className = 'trivia-message';
    if (type) triviaMessage.classList.add(type);
  }

  function openTriviaWindow() {
    openWindow('triviaWindow');
  }

  function openClueWindow() {
    openWindow('clueWindow');
  }

  function markPuzzleComplete(key) {
    completedPuzzles.add(key);
    updatePuzzleProgress();
  }

  function renderPuzzleQuestion(key, completedView = false) {
    const puzzle = puzzleQuestions[key];
    if (!puzzle || !triviaAnswers) return;

    if (triviaWindowTitle) triviaWindowTitle.textContent = puzzle.title;
    if (triviaQuestion) triviaQuestion.textContent = puzzle.question;
    triviaAnswers.replaceChildren();
    updatePuzzleProgress();

    if (completedView) {
      const completedAnswer = document.createElement('div');
      completedAnswer.className = 'trivia-completed-answer';
      completedAnswer.textContent = puzzle.displayAnswer;
      triviaAnswers.append(completedAnswer);
      if (puzzle.pathPart) {
        const pathPart = document.createElement('div');
        pathPart.className = 'trivia-path-part';
        pathPart.textContent = `Recovered path segment: ${puzzle.pathPart}`;
        triviaAnswers.append(pathPart);
      }
      showPuzzleMessage(
        puzzle.final ? 'Completed. Clue #2 is available.' : 'Completed. The accepted answer is shown.',
        'correct'
      );
      openTriviaWindow();
      return;
    }

    const form = document.createElement('form');
    form.className = 'trivia-answer-form';

    const input = document.createElement('input');
    input.className = 'trivia-answer-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = 'Type your answer';
    input.setAttribute('aria-label', `Answer for ${puzzle.title}`);

    const submit = document.createElement('button');
    submit.className = 'toolbar-button trivia-submit';
    submit.type = 'submit';
    submit.textContent = 'Submit';

    form.append(input, submit);
    triviaAnswers.append(form);

    form.addEventListener('submit', event => {
      event.preventDefault();
      const submitted = normalizePuzzleAnswer(input.value);
      const accepted = puzzle.answers.some(answer => normalizePuzzleAnswer(answer) === submitted);

      if (accepted) {
        markPuzzleComplete(key);
        input.disabled = true;
        submit.disabled = true;
        input.value = puzzle.displayAnswer;
        input.classList.add('correct-answer');
        showPuzzleMessage(
          puzzle.final ? 'Correct. Clue #2 has been unlocked.' : 'Correct. This station is complete.',
          'correct'
        );
        if (puzzle.final) openClueWindow();
        return;
      }

      const attempts = (puzzleAttempts.get(key) || 0) + 1;
      puzzleAttempts.set(key, attempts);
      const hintIndex = Math.min(attempts - 1, puzzle.hints.length - 1);
      const hint = puzzle.hints[hintIndex];
      showPuzzleMessage(`That does not match. Hint: ${hint}`, 'wrong');
      input.select();
    });

    showPuzzleMessage('');
    openTriviaWindow();
    window.setTimeout(() => input.focus(), 0);
  }

  function showWhitePuzzleLockedMessage() {
    if (triviaWindowTitle) triviaWindowTitle.textContent = 'Final Station Locked';
    if (triviaQuestion) triviaQuestion.textContent = 'There are things that need to be finished.';
    triviaAnswers?.replaceChildren();
    updatePuzzleProgress();
    showPuzzleMessage('Finish what you have started first.', 'wrong');
    openTriviaWindow();
  }

  puzzleMap?.addEventListener('click', event => {
    const hotspot = event.target.closest('.puzzle-hotspot');
    if (!hotspot) return;

    const key = hotspot.dataset.puzzle;
    if (!key) return;

    if (key === 'white' && !allRegularPuzzlesComplete()) {
      showWhitePuzzleLockedMessage();
      return;
    }

    if (completedPuzzles.has(key)) {
      if (key === 'white') openClueWindow();
      else renderPuzzleQuestion(key, true);
      return;
    }

    renderPuzzleQuestion(key, false);
  });

  hotspotToggle?.addEventListener('change', () => {
    puzzleMap?.classList.toggle('show-hotspots', hotspotToggle.checked);
  });

  resetPuzzleProgress?.addEventListener('click', () => {
    completedPuzzles.clear();
    puzzleAttempts.clear();
    updatePuzzleProgress();
    showPuzzleMessage('Puzzle progress reset.');
  });

  if (triviaLockout) triviaLockout.hidden = true;
  updatePuzzleProgress();

  /*
   * Computer identity recovery
   */

  const openIdentityRecovery = document.getElementById('openIdentityRecovery');
  const identityRecoveryWindow = document.getElementById('identityRecoveryWindow');
  const identityRecoveryForm = document.getElementById('identityRecoveryForm');
  const identityRecoveryInput = document.getElementById('identityRecoveryInput');
  const identityRecoveryMessage = document.getElementById('identityRecoveryMessage');
  const cancelIdentityRecovery = document.getElementById('cancelIdentityRecovery');
  const closeIdentityResult = document.getElementById('closeIdentityResult');

  function openIdentityRecoveryDialog() {
    openWindow('identityRecoveryWindow');
    if (identityRecoveryInput) identityRecoveryInput.value = '';
    if (identityRecoveryMessage) identityRecoveryMessage.textContent = '';
    requestAnimationFrame(() => identityRecoveryInput?.focus());
  }

  openIdentityRecovery?.addEventListener('click', openIdentityRecoveryDialog);

  cancelIdentityRecovery?.addEventListener('click', () => {
    closeWindow(identityRecoveryWindow);
    focusWindow(document.getElementById('computerWindow'));
  });

  identityRecoveryForm?.addEventListener('submit', event => {
    event.preventDefault();

    const answer = String(identityRecoveryInput?.value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    if (answer !== 'ALIAS') {
      if (identityRecoveryMessage) {
        identityRecoveryMessage.textContent = 'Recovery name not recognized.';
      }
      identityRecoveryInput?.select();
      return;
    }

    closeWindow(identityRecoveryWindow);
    openWindow('identityResultWindow');
  });

  closeIdentityResult?.addEventListener('click', () => {
    closeWindow(document.getElementById('identityResultWindow'));
    openWindow('postcardViewerWindow');
  });

  /*
   * About app keyword unlock
   */

  const aboutMoreDetails = document.getElementById('aboutMoreDetails');
  const aboutKeywordWindow = document.getElementById('aboutKeywordWindow');
  const aboutKeywordForm = document.getElementById('aboutKeywordForm');
  const aboutKeywordInput = document.getElementById('aboutKeywordInput');
  const aboutKeywordMessage = document.getElementById('aboutKeywordMessage');
  const cancelAboutKeyword = document.getElementById('cancelAboutKeyword');
  const downloadModelPlaceholder = document.getElementById('downloadModelPlaceholder');
  const modelDeliveryMessage = document.getElementById('modelDeliveryMessage');
  const checkNewModelBtn = document.getElementById('checkNewModelBtn');
  const modelFileInput = document.getElementById('fileInput');
  const modelViewerStatus = document.getElementById('status');
  let offlineModelAvailable = false;

  function normalizeAboutKeyword(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  function isValidAboutKeyword(value) {
    const normalized = normalizeAboutKeyword(value);
    const accepted = new Set([
      'model',
      'the model',
      '3d model',
      '3 d model',
      'model viewer',
      '3dmodel'
    ]);

    return accepted.has(normalized) || normalized.replace(/\s/g, '') === 'model';
  }

  function openAboutKeywordWindow() {
    if (!aboutKeywordWindow) return;
    openWindow('aboutKeywordWindow');
    if (aboutKeywordInput) aboutKeywordInput.value = '';
    if (aboutKeywordMessage) aboutKeywordMessage.textContent = '';
    requestAnimationFrame(() => aboutKeywordInput?.focus());
  }

  aboutMoreDetails?.addEventListener('click', openAboutKeywordWindow);

  cancelAboutKeyword?.addEventListener('click', () => {
    closeWindow(aboutKeywordWindow);
    focusWindow(document.getElementById('aboutWindow'));
  });

  aboutKeywordForm?.addEventListener('submit', event => {
    event.preventDefault();

    if (!isValidAboutKeyword(aboutKeywordInput?.value)) {
      if (aboutKeywordMessage) {
        aboutKeywordMessage.textContent = 'Keyword not recognized. It is a 5 letters word.';
      }
      aboutKeywordInput?.select();
      return;
    }

    closeWindow(aboutKeywordWindow);
    openWindow('aboutDownloadWindow');
  });

  async function sendBookToModelViewer() {
    if (!modelFileInput) return;

    if (modelViewerStatus) {
      modelViewerStatus.textContent = 'Loading book.glb...';
    }

    try {
      const response = await fetch('./book.glb');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const file = new File([blob], 'book.glb', {
        type: blob.type || 'model/gltf-binary'
      });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      modelFileInput.files = transfer.files;
      modelFileInput.dispatchEvent(new Event('change', { bubbles: true }));

      offlineModelAvailable = false;
      if (checkNewModelBtn) checkNewModelBtn.hidden = true;
    } catch (error) {
      console.error('Could not load the offline model.', error);
      if (modelViewerStatus) {
        modelViewerStatus.textContent = 'Could not open book.glb. Check that the file is beside index.html.';
      }
    }
  }

  downloadModelPlaceholder?.addEventListener('click', () => {
    if (sessionMode === 'offline') {
      offlineModelAvailable = true;
      if (checkNewModelBtn) checkNewModelBtn.hidden = false;
      if (modelDeliveryMessage) {
        modelDeliveryMessage.textContent =
          'Offline delivery complete. Open Model Viewer and press Check new model.';
      }
      playSoundEffect('notify');
      return;
    }

    const link = document.createElement('a');
    link.href = './book.glb';
    link.download = 'book.glb';
    document.body.append(link);
    link.click();
    link.remove();

    if (modelDeliveryMessage) {
      modelDeliveryMessage.textContent = 'Download started.';
    }
  });

  checkNewModelBtn?.addEventListener('click', () => {
    if (!offlineModelAvailable) {
      if (modelViewerStatus) modelViewerStatus.textContent = 'No new offline model is available.';
      return;
    }
    sendBookToModelViewer();
  });


  /*
   * Mail key-rack puzzle
   */

  const openKeyRack = document.getElementById('openKeyRack');
  const keyPool = document.getElementById('keyPool');
  const keySlots = Array.from(document.querySelectorAll('.key-slot'));
  const checkKeyPuzzle = document.getElementById('checkKeyPuzzle');
  const resetKeyPuzzle = document.getElementById('resetKeyPuzzle');
  const keyPuzzleMessage = document.getElementById('keyPuzzleMessage');
  const keyThanksEmail = document.getElementById('keyThanksEmail');
  const mailInboxCount = document.getElementById('mailInboxCount');
  const openPaperClue = document.getElementById('openPaperClue');
  const openMorseCode = document.getElementById('openMorseCode');
  const mailMessages = Array.from(document.querySelectorAll('[data-mail-reader]'));
  const mailReaderPanels = Array.from(document.querySelectorAll('[data-mail-reader-panel]'));



  function showMailReader(readerId) {
    mailReaderPanels.forEach(panel => {
      panel.hidden = panel.id !== readerId;
    });
    mailMessages.forEach(message => {
      const active = message.dataset.mailReader === readerId;
      message.classList.toggle('active', active);

      if (active) {
        message.classList.remove('unread');
        message.classList.add('seen');

        const mailStatus = message.querySelector('small');
        if (mailStatus) mailStatus.textContent = 'Seen';
      }
    });
  }

  mailMessages.forEach(message => {
    message.addEventListener('click', () => {
      showMailReader(message.dataset.mailReader);
    });
  });

  openPaperClue?.addEventListener('click', () => {
    openWindow('paperViewerWindow');
  });

  openMorseCode?.addEventListener('click', () => {
    openWindow('codeViewerWindow');
  });

  const keyFiles = {
    1: './Assets/mail/Key_1.png',
    2: './Assets/mail/Key_2.png',
    3: './Assets/mail/Key_3.png',
    4: './Assets/mail/Key_4.png',
    5: './Assets/mail/Key_5.png',
    6: './Assets/mail/Key_6.png'
  };

  let keyOrder = [4, 1, 6, 2, 5, 3];
  let keyPlacements = [null, null, null, null, null, null];
  let selectedKey = null;
  let keyAttempts = 0;
  let keyPuzzleSolved = false;

  // The follow-up email must not appear before the rack is solved.
  if (keyThanksEmail) keyThanksEmail.hidden = true;
  if (mailInboxCount) mailInboxCount.textContent = '2';

  function createKeyButton(keyNumber) {
    const button = document.createElement('button');
    button.className = 'key-piece';
    button.type = 'button';
    button.draggable = !keyPuzzleSolved;
    button.dataset.key = String(keyNumber);
    button.setAttribute('aria-label', `Key with ${keyNumber} hole${keyNumber === 1 ? '' : 's'}`);
    if (selectedKey === keyNumber) button.classList.add('selected');

    const image = document.createElement('img');
    image.src = keyFiles[keyNumber];
    image.alt = '';
    image.draggable = false;
    button.append(image);

    button.addEventListener('click', () => {
      if (keyPuzzleSolved) return;
      const slotIndex = keyPlacements.indexOf(keyNumber);
      if (slotIndex !== -1) {
        keyPlacements[slotIndex] = null;
        selectedKey = keyNumber;
      } else {
        selectedKey = selectedKey === keyNumber ? null : keyNumber;
      }
      renderKeyPuzzle();
    });

    button.addEventListener('dragstart', event => {
      if (keyPuzzleSolved) {
        event.preventDefault();
        return;
      }
      event.dataTransfer?.setData('text/plain', String(keyNumber));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    });

    return button;
  }

  function placeKey(keyNumber, slotIndex) {
    if (keyPuzzleSolved || !keyFiles[keyNumber]) return;

    const oldSlot = keyPlacements.indexOf(keyNumber);
    if (oldSlot !== -1) keyPlacements[oldSlot] = null;

    const displacedKey = keyPlacements[slotIndex];
    keyPlacements[slotIndex] = keyNumber;
    selectedKey = displacedKey || null;
    keyPuzzleMessage.textContent = displacedKey
      ? 'The displaced key is selected. Choose another hook for it.'
      : 'Key placed. Arrange all six, then press Done.';
    renderKeyPuzzle();
  }

  function renderKeyPuzzle() {
    if (!keyPool || !keySlots.length) return;

    keyPool.replaceChildren();
    const placed = new Set(keyPlacements.filter(Boolean));
    keyOrder.forEach(keyNumber => {
      if (!placed.has(keyNumber)) keyPool.append(createKeyButton(keyNumber));
    });

    keySlots.forEach((slot, index) => {
      slot.replaceChildren();
      slot.classList.toggle('filled', Boolean(keyPlacements[index]));
      slot.classList.toggle('selected-target', selectedKey !== null && !keyPuzzleSolved);
      slot.disabled = keyPuzzleSolved;
      const keyNumber = keyPlacements[index];
      if (keyNumber) slot.append(createKeyButton(keyNumber));
    });
  }

  keySlots.forEach((slot, index) => {
    slot.addEventListener('click', event => {
      if (event.target.closest('.key-piece')) return;
      if (keyPuzzleSolved) return;
      if (selectedKey !== null) {
        placeKey(selectedKey, index);
      } else if (keyPlacements[index]) {
        selectedKey = keyPlacements[index];
        keyPlacements[index] = null;
        renderKeyPuzzle();
      }
    });

    slot.addEventListener('dragover', event => {
      if (keyPuzzleSolved) return;
      event.preventDefault();
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));

    slot.addEventListener('drop', event => {
      if (keyPuzzleSolved) return;
      event.preventDefault();
      slot.classList.remove('drag-over');
      const keyNumber = Number(event.dataTransfer?.getData('text/plain'));
      placeKey(keyNumber, index);
    });
  });

  openKeyRack?.addEventListener('click', () => {
    openWindow('keyPuzzleWindow');
    renderKeyPuzzle();
  });

  resetKeyPuzzle?.addEventListener('click', () => {
    if (keyPuzzleSolved) return;
    keyPlacements = [null, null, null, null, null, null];
    selectedKey = null;
    keyAttempts = 0;
    keyPuzzleMessage.textContent = 'Place every key on a hook, then press Done.';
    renderKeyPuzzle();
  });

  checkKeyPuzzle?.addEventListener('click', () => {
    if (keyPuzzleSolved) return;

    if (keyPlacements.some(value => value === null)) {
      keyPuzzleMessage.textContent = 'Warning: Every hook needs a key before you press Done.';
      return;
    }

    const correct = keyPlacements.every((keyNumber, index) => keyNumber === index + 1);
    if (correct) {
      keyPuzzleSolved = true;
      selectedKey = null;
      keyPuzzleMessage.textContent = 'Perfect. The keys are back in the correct order. You have a new email.';
      if (keyThanksEmail) keyThanksEmail.hidden = false;
      if (mailInboxCount) mailInboxCount.textContent = '3';
      playSoundEffect('notify');
      checkKeyPuzzle.disabled = true;
      resetKeyPuzzle.disabled = true;
      document.getElementById('keyRackStage')?.classList.add('solved');
      renderKeyPuzzle();
      return;
    }

    keyAttempts += 1;
    keyPuzzleMessage.textContent = 'Warning: The keys are not in the correct order.';
  });

  renderKeyPuzzle();

  /*
   * Clean the initial taskbar state.
   * Hidden applications should not appear active at launch.
   */

  document
    .querySelectorAll('.app-window[hidden]')
    .forEach(win => {
      taskItems
        ?.querySelector(`[data-task="${win.id}"]`)
        ?.remove();

      win.classList.remove('is-active');
    });
})();
