(function() {
  const minFontSize = 6;
  const maxFontSize = 30;
  let currentFontSize = 12;

  function createFontSizeAdjuster() {
      const adjuster = document.createElement('div');
      adjuster.id = 'font-size-adjuster';
      adjuster.style.position = 'fixed';
      adjuster.style.top = '10px';
      adjuster.style.right = '10px';
      adjuster.style.backgroundColor = 'black';
      adjuster.style.padding = '5px';
      adjuster.style.border = '1px solid white';
      adjuster.style.fontFamily = 'monospace';

      const decreaseBtn = createButton('<', decreaseFontSize);
      const increaseBtn = createButton('>', increaseFontSize);
      const sizeDisplay = document.createElement('span');
      sizeDisplay.id = 'font-size-display';
      sizeDisplay.style.color = 'white';
      sizeDisplay.style.margin = '0 10px';

      adjuster.appendChild(decreaseBtn);
      adjuster.appendChild(sizeDisplay);
      adjuster.appendChild(increaseBtn);

      document.body.appendChild(adjuster);
      updateFontSize();
  }

  function createButton(text, onClick) {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.backgroundColor = 'black';
      button.style.color = 'white';
      button.style.border = '1px solid white';
      button.style.padding = '2px 6px';
      button.style.margin = '0 2px';
      button.style.cursor = 'pointer';
      button.style.fontFamily = 'monospace';
      button.style.transition = 'background-color 0.3s, color 0.3s';

      button.addEventListener('mouseover', () => {
          button.style.backgroundColor = 'white';
          button.style.color = 'black';
      });

      button.addEventListener('mouseout', () => {
          button.style.backgroundColor = 'black';
          button.style.color = 'white';
      });

      button.addEventListener('mousedown', () => {
          button.style.backgroundColor = '#444';
          button.style.color = 'white';
      });

      button.addEventListener('mouseup', () => {
          button.style.backgroundColor = 'white';
          button.style.color = 'black';
      });

      button.addEventListener('click', onClick);
      return button;
  }

  function decreaseFontSize() {
      if (currentFontSize > minFontSize) {
          currentFontSize--;
          updateFontSize();
      }
  }

  function increaseFontSize() {
      if (currentFontSize < maxFontSize) {
          currentFontSize++;
          updateFontSize();
      }
  }

  function updateFontSize() {
      document.body.style.fontSize = `${currentFontSize}px`;
      document.getElementById('font-size-display').textContent = `${currentFontSize}px`;
  }

  document.addEventListener('DOMContentLoaded', createFontSizeAdjuster);
})();