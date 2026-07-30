(() => {
  const desktop = document.getElementById('desktop');
  const taskItems = document.getElementById('taskItems');
  const startMenu = document.getElementById('startMenu');
  const startButton = document.getElementById('startButton');
  const sleepScreen = document.getElementById('sleepScreen');

  let topZ = 20;

  const appIconClass = {
    viewerWindow: 'model-icon',
    computerWindow: 'computer-icon',
    musicWindow: 'disk-icon',
    aboutWindow: 'info-icon',
    notesWindow: 'notes-icon'
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

    if (win.id === 'viewerWindow') {
      icon.textContent = '3D';
    }

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
  const notesList = document.getElementById('notesList');
  const noteTitle = document.getElementById('noteTitle');
  const noteBody = document.getElementById('noteBody');
  const noteSaveStatus = document.getElementById('noteSaveStatus');
  let notes = [];
  let activeNoteId = null;
  let noteSaveTimer = null;

  function makeNote() {
    const now = Date.now();
    return { id: String(now), title: 'Untitled note', body: '', updatedAt: now };
  }

  function loadNotes() {
    try {
      const stored = JSON.parse(localStorage.getItem(notesStorageKey) || '[]');
      notes = Array.isArray(stored) ? stored : [];
    } catch {
      notes = [];
    }

    if (notes.length === 0) notes.push(makeNote());
    activeNoteId = notes[0].id;
    renderNotes();
    loadActiveNote();
  }

  function saveNotes() {
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

        const title = document.createElement('span');
        title.className = 'note-list-title';
        title.textContent = note.title.trim() || 'Untitled note';

        const date = document.createElement('span');
        date.className = 'note-list-date';
        date.textContent = new Date(note.updatedAt).toLocaleString([], {
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
    if (noteTitle) noteTitle.value = note.title;
    if (noteBody) noteBody.value = note.body;
  }

  function updateActiveNote() {
    const note = notes.find(item => item.id === activeNoteId);
    if (!note) return;
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
    notes = notes.filter(note => note.id !== activeNoteId);
    if (notes.length === 0) notes.push(makeNote());
    activeNoteId = notes[0].id;
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

  const tracks = [
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
    if (trackMeta) trackMeta.textContent = track.artist;

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

  document.getElementById('previousBtn')
    ?.addEventListener('click', previousTrack);

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

  if (audio) audio.volume = Number(volumeBar?.value || 0.8);

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