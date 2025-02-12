import { Scene } from './js/Scene.js';
import { Modal } from './js/Modal.js';
import { Accordion } from './js/Accordion.js';

document.addEventListener('DOMContentLoaded', async () => {

  const container = document.getElementById('container');
  const scene = new Scene(container);
  scene.init();

  //Когда двигаем модель, обновляем координаты в модальном окне
  scene.onPositionChanged = (coords) => { 
    updateCoordinatesAccordion(coords);
  };

  // UI
  const modelFileInput = document.getElementById('modelFileInput');
  const uploadModelBtn = document.getElementById('uploadModelBtn');
  const materialNameSelect = document.getElementById('materialNameSelect');
  const colorPicker = document.getElementById('colorPicker');
  const restoreColorBtn = document.getElementById('restoreColorBtn');
  const dialog = document.getElementById('modal');
  const openModalBtn = document.getElementById('openModalBtn');
  const modalClose = document.getElementById('modalClose');
  const changeOnBlueBtn = document.getElementById('blue');

  const modalContent = document.querySelector('#modal .content');
  const accordion = new Accordion(modalContent);

  // Функция обновления аккордеона
  const updateCoordinatesAccordion = ({ x, y, z }) => {
    accordion.clear();
    accordion.addAccordion('Основные свойства', [
      { label: 'Диаметр', value: '80 мм' },
      { label: 'Давление', value: '10,0 МПа' },
    ]);

    accordion.addAccordion('Координаты', [
      { label: 'X', value: `${x} мм` },
      { label: 'Y', value: `${y} мм` },
      { label: 'Z', value: `${z} мм` },
    ]);
  };

  const modal = new Modal(dialog, openModalBtn, modalClose);
  modal.init();

  // Загрузка дефолтной модели
  const defaultModelPath = 'models/armatura1_LOD0.glb';
  await scene.loadModel(defaultModelPath);

  // Обновим материал в дропдауне
  updateMaterialDropdown();

  // Загрузка модели из файла
  uploadModelBtn.addEventListener('click', async () => {
    const files = modelFileInput.files;
    if (files.length > 0) {
      await scene.loadModelFromFile(files[0]);
      updateMaterialDropdown();
    } else {
      alert('Выберите .glb модель');
    }
  });

  // При смене материала
  materialNameSelect.addEventListener('change', () => {
    const selectedMaterial = materialNameSelect.value;
    colorPicker.value = scene.getMaterialColor(selectedMaterial);
    scene.updateTargetMaterial(selectedMaterial);
  });

  // При выборе цвета
  colorPicker.addEventListener('input', () => {
    scene.changeTargetMaterialColor(colorPicker.value);
  });

  // Восстановление исходного цвета
  restoreColorBtn.addEventListener('click', () => {
    scene.restoreAllMaterialsColor();
    colorPicker.value = scene.getMaterialColor(materialNameSelect.value);
  });

  // Смена голубого материала на синий
  changeOnBlueBtn.addEventListener('click', () => {
    scene.updateTargetMaterial('blue.005');
    scene.changeTargetMaterialColor('#0000ff');

    if (materialNameSelect.value === 'blue.005'){
      colorPicker.value = '#0000ff';
    }
  });

  // Обновить выпадающий список материалов
  function updateMaterialDropdown() {
    materialNameSelect.innerHTML = '';
    const materialNames = scene.getMaterialNames();

    if (!materialNames.length) {
      const option = document.createElement('option');
      option.text = 'Материалы не найдены';
      option.disabled = true;
      materialNameSelect.appendChild(option);
      return;
    }

    materialNames.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.text = name;
      materialNameSelect.appendChild(option);
    });

    materialNameSelect.value = materialNames[0];
    colorPicker.value = scene.getMaterialColor(materialNames[0]);
    scene.updateTargetMaterial(materialNames[0]);
  }

  window.addEventListener('keydown', (event) => {
    if (!scene.transformControls) return;
  
    const key = event.key.toLowerCase();
  
    if (['g', 'п'].includes(key)) {
      scene.transformControls.setMode('translate');
    } else if (['r', 'к'].includes(key)) {
      scene.transformControls.setMode('rotate');
    } else if (['s', 'ы'].includes(key)) {
      scene.transformControls.setMode('scale');
    }
  });

});
