export class Accordion {
  constructor(container) {
    this.container = container;
    this.accordions = []; // список аккордеонов
    this.init();
  }

  /**
   * Инициализация существующих аккордеонов
   */
  init() {
    const existingAccordions = this.container.querySelectorAll('.accordion');
    existingAccordions.forEach((button) => {
      this.setupAccordion(button);
    });
  }

  /**
   * Создаёт и добавляет новый элемент аккордеона
   */
  addAccordion(title, items) {
    const button = document.createElement('button');
    button.classList.add('accordion');

    // Создаём обертку для текста + иконки
    const buttonContent = document.createElement('span');
    buttonContent.textContent = title;

    // Создаём стрелку
    const arrow = document.createElement('span');
    arrow.classList.add('accordion-arrow');
    arrow.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
<path d="M3 11L11.8408 19.8408C12.1464 20.1464 12.6419 20.1464 12.9475 19.8408L21.3941 11.3941" stroke="#F2D6C5" stroke-width="2.34758" stroke-linecap="round"/>
</svg>
    `;

    button.appendChild(buttonContent);
    button.appendChild(arrow);

    const panel = document.createElement('ul');
    panel.classList.add('panel');

    items.forEach(({ label, value }) => {
      const li = document.createElement('li');
      li.innerHTML = `<p>${label}:</p><p>${value}</p>`;
      panel.appendChild(li);
    });

    this.setupAccordion(button, arrow);
    this.container.appendChild(button);
    this.container.appendChild(panel);
    this.accordions.push({ button, panel, arrow });
  }

  /**
   * Настраивает логику для аккордеона (уже существующего или нового)
   */
  setupAccordion(button, arrow = null) {
    button.addEventListener('click', function () {
      this.classList.toggle('active');
      const panel = this.nextElementSibling;
      const icon = arrow || this.querySelector('.accordion-arrow svg');

      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
        icon.classList.remove('rotated'); // Убираем поворот
      } else {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        icon.classList.add('rotated'); // Добавляем поворот
      }
    });
  }

  /**
   * Удаляет все динамически добавленные элементы аккордеона
   */
  clear() {
    this.accordions.forEach(({ button, panel }) => {
      this.container.removeChild(button);
      this.container.removeChild(panel);
    });
    this.accordions = [];
  }
}
