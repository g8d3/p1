var presetInterval = 10;
var presetUrl = 'http://localhost:8080/test.html';
var presetCode = function() {
  window.postMessage({ action: 'debug', message: 'Code started' }, '*');
  try {
    var table = document.querySelector('table');
    if (!table) throw 'Table not found';
    var data = Array.from(table.rows).slice(1).map(function(row) {
      var cells = Array.from(row.cells);
      var texts = cells.map(function(cell) { return cell.textContent.trim(); });
      return texts.slice(1);
    });
    tradrSink(data);
  } catch (e) {
    tradrSink('Error: ' + e);
  }
};