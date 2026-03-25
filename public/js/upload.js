// 上传页面交互增强
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('htmlfile');
const dropContent = document.getElementById('dropContent');
const dropIcon = dropZone ? dropZone.querySelector('.drop-icon') : null;
const dropText = dropZone ? dropZone.querySelector('.drop-text') : null;
const submitBtn = document.getElementById('submitBtn');
const titleInput = document.getElementById('title');

if (fileInput) {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      updateDropZone(file.name);
      // 自动填充标题（如果为空）
      if (titleInput && !titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.html$/i, '');
      }
    }
  });
}

if (dropZone) {
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.html')) {
      fileInput.files = e.dataTransfer.files;
      updateDropZone(file.name);
      if (titleInput && !titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.html$/i, '');
      }
    } else {
      alert('请拖入 .html 格式的文件');
    }
  });
}

function updateDropZone(filename) {
  if (!dropZone) return;
  dropZone.classList.add('has-file');
  dropZone.classList.remove('drag-over');
  if (dropIcon) dropIcon.textContent = '✅';
  if (dropText) dropText.textContent = filename;
}

// 防止重复提交
const uploadForm = document.getElementById('uploadForm');
if (uploadForm && submitBtn) {
  uploadForm.addEventListener('submit', () => {
    submitBtn.disabled = true;
    submitBtn.textContent = '上传中…';
  });
}
