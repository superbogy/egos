const handleNavClick = (e, type) => {
  const activeElm = document.querySelector('span.nav-group-item.active');
  if (activeElm) {
    activeElm.classList.remove('active');
  }
  if (e.target.classList.contains('nav-group-item')) {
    e.target.classList.add('active');
  }
  if (e.target.parentElement.classList.contains('nav-group-item')) {
    e.target.parentElement.classList.add('active');
  }
  const location = window.location;
  const search = location.search.replace(/[?|&]+type=[^&]+/g, '');
  const url = [location.origin, '/share?', search + '&type=' + type].join('');
  window.location.href = url;
};

const showUploadForm = () => {
  const form = document.getElementById('uploader');
  form.style.display = 'flex';
  const dropArea = document.getElementById('up-drop');
  const fileElm = document.getElementById('up-file');
  fileElm.onchange = (e) => {
    console.log('file change ', e.target.files);
    Array.from(e.target.files).map((f) => dropFiles.push(f));
  };
  console.log(dropArea);
  const dropFiles = [];
  function traverseFileTree(item, path) {
    path = path || '';
    console.log('traverseFile', item);
    if (item.isFile) {
      item.file(function (file) {
        console.log('File:', path + file.name);
        dropFiles.push(file);
      });
    } else if (item.kind === 'directory') {
      // Get folder contents
      const dirReader = item.createReader();
      dirReader.readEntries(function (entries) {
        for (const entry of entries) {
          traverseFileTree(entry, path + item.name + '/');
        }
      });
    }
  }
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const items = e.dataTransfer.items;
    for (const item of items) {
      // webkitGetAsEntry is where the magic happens
      const entry = item.webkitGetAsEntry();
      if (entry) {
        traverseFileTree(entry);
      }
    }
  });
  dropArea.addEventListener('dragover', (e) => {
    console.log('dragover over');
    e.preventDefault();
    dropArea.classList.add('up-drop-over');
  });
  dropArea.addEventListener('dragleave', (e) => {
    console.log('dragleave dragleave');
    e.preventDefault();
    console.log(dropArea.classList);
    dropArea.classList.remove('up-drop-over');
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userElm = document.getElementById('up-username');
    const formData = new FormData();
    // formData.append('username', userElm.value || 'tommy');
    for (const file of dropFiles) {
      formData.append('files', file);
    }
    const location = window.location;
    const url = [location.origin, '/files/upload?', location.search].join('');
    fetch(url, {
      method: 'post',
      body: formData,
    })
      .then((res) => {
        console.log(res);
        hideUploadForm({ target: { id: 'uploader' } });
        message('success');
      })
      .catch((err) => ('Error occured', err));
  });
};

const hideUploadForm = (e) => {
  console.log('hide form', e);
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (e.target.id === 'uploader') {
    const form = document.getElementById('uploader');
    form.style.display = 'none';
  }
};

function openFileDialog() {
  const input = document.getElementById('up-file');
  console.log(input);
  if (!input) {
    return;
  }
  input.click();
}

function message(msg, delay = 1500) {
  const popup = document.createElement('div');
  popup.className = 'msg-popup';
  popup.id = 'pop';
  const message = document.createElement('span');
  message.innerHTML = msg;
  popup.appendChild(message);
  document.body.appendChild(popup);
  setTimeout(() => {
    popup.remove();
  }, delay);
}

function download(id) {
  const url = [location.origin, `/files/${id}/download`, location.search].join('');
  window.location.href = url;
  return false;
}

function handleColumnClick(e) {
  if (e.target.tagName === 'TD') {
    const activeElm = document.querySelector('tr.active');
    if (activeElm) {
      activeElm.classList.remove('active');
    }
    e.target.parentElement.classList.add('active');
  }
}
