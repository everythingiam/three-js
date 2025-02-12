import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class Scene {

  constructor(container) {

    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;

    this.transformControls = null;
    // Callback, чтобы из сцены сигналить во вне
    // (например, чтобы main.js обновлял аккордеон)
    this.onPositionChanged = null;

    // Материал для смены цвета
    this.targetMaterial = null;
    
    this.meshes = []; // список материалов
    this.colorTransition = null; // Данные для плавного изменения цвета

  } 

  /*
   * Инициализация сцены
   */
  init() {

    this.scene = new THREE.Scene(); //создание сцены
    this.scene.background = new THREE.Color(0x1A1917);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000); //настройка камеры
    this.camera.position.set(1.5, 1.5, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true }); //настройка WebGL
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement); //настройка орбиты
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0.5, 0);

    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    // когда двигаем модель, отключаем управление камерой
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.controls.enabled = !event.value;
    });
    // когда положение модели изменилось, шлём координаты вверх
    this.transformControls.addEventListener('change', () => {
      if (this.onPositionChanged) {
        this.onPositionChanged(this.getCoordinates());
      }
    });
    this.scene.add(this.transformControls);

    this.#setupLights();
    this.#render();

    window.addEventListener('resize', this.#onWindowResize.bind(this), false);

  }

  /*
   * Настройка освещения
   */
  #setupLights() {

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight1.position.set(3, 5, 2);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-3, 5, -2);
    this.scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 10);
    pointLight.position.set(2, 2, 2);
    this.scene.add(pointLight);

  }

  /*
   * Загрузка модели
   */
  async loadModel(url) {

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          if (this.model) {
            this.scene.remove(this.model);
            this.meshes = [];
          }
          this.model = gltf.scene;

          this.model.traverse((child) => {
            if (child.isMesh) {
              this.meshes.push(child);
              child.castShadow = true;
              child.receiveShadow = true;
              // запомним оригинальный цвет, если не сохранён
              child.material.userData.originalColor ??= child.material.color.clone();
            }
          });

          this.scene.add(this.model);

          this.transformControls.attach(this.model);

          resolve();
        },
        undefined,
        (error) => {
          console.error('Ошибка при загрузке модели:', error);
          reject(error);
        }
      );
    });

  }

  /*
   * Загрузка модели из файла
   */
  async loadModelFromFile(file) {

    const url = URL.createObjectURL(file);
    await this.loadModel(url);
  }

  /*
   * Установить выбранный материал 
   */
  updateTargetMaterial(materialName) {
    if (!this.model) return;
    this.model.traverse((child) => {
      if (child.isMesh && child.material?.name === materialName) {
        this.targetMaterial = child.material;
        // сохраним исходный цвет, если не сохранён
        this.targetMaterial.userData.originalColor ??= this.targetMaterial.color.clone();
      }
    });

  }

  /*
   * Плавно сменить цвет выбранного материала
   */
  changeTargetMaterialColor(newColor, duration = 0.6) {

    if (!this.targetMaterial) return;
    const startColor = this.targetMaterial.color.clone();
    const endColor = new THREE.Color(newColor);
    this.colorTransition = {
      material: this.targetMaterial,
      startColor,
      endColor,
      startTime: performance.now(),
      duration: duration * 1000,
    };

  }

  /*
   * Восстановить исходные цвета всех материалов
   */
  restoreAllMaterialsColor() {

    this.meshes.forEach((mesh) => {
      if (mesh.material?.userData.originalColor) {
        mesh.material.color.copy(mesh.material.userData.originalColor);
      }
    });

  }

  /*
   * Получить все имена материалов
   */
  getMaterialNames() {

    const setOfNames = new Set();
    this.meshes.forEach((m) => m.material?.name && setOfNames.add(m.material.name));
    return [...setOfNames];

  }

  /*
   * Получить цвет материала по имени
   */
  getMaterialColor(materialName) {

    const mesh = this.meshes.find((m) => m.material?.name === materialName);
    if (!mesh) return null;

    const hexColor = mesh.material.color.getHex();
    return `#${hexColor.toString(16).padStart(6, '0')}`;

  }

  /*
   * Обновление плавного перехода цвета
   */
  updateColorTransition() {

    if (!this.colorTransition) return;
    const { material, startColor, endColor, startTime, duration } = this.colorTransition; //параметры анимации
    const now = performance.now();
    // вычисляем, сколько времени прошло с начала анимации
    const elapsed = now - startTime;

    // рассчитываем коэффициент интерполяции от 0 до 1
    const t = THREE.MathUtils.clamp(elapsed / duration, 0, 1);

    // линейно интерполируем (lerp) цвет материала от начального к конечному
    material.color.lerpColors(startColor, endColor, t);

    if (t >= 1) this.colorTransition = null;

  }

  /*
   * Получить текущие координаты модели
   */
  getCoordinates() {

    if (!this.model) return { x: 0, y: 0, z: 0 };
    const { x, y, z } = this.model.position;
    return {
      x: x.toFixed(2) * 100,
      y: y.toFixed(2) * 100,
      z: z.toFixed(2) * 100,
    };

  }

  /*
   * Рендер-луп
   */
  #render = () => {

    requestAnimationFrame(this.#render);
    this.updateColorTransition();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

  };

  /*
   * Ресайз рендера при изменении размеров окна
   */
  #onWindowResize() {

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
  }
}
