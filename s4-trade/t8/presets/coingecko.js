/*
https://www.coingecko.com/price_charts/<href last>/usd/<time>.json

href last is the last part of the href of the coin page, in https://www.coingecko.com/en/coins/xxxxx, it is xxxxx

times: max, 7_days, 24_hours, 30_days, 90_days, custom?from=1758621747&to=1758968689


https://www.coingecko.com/en/coins/<imageId>/markets/<cex|dex|all>/<perpetuals|spot>/<field>_<asc|desc>

fields for spot: volume, price, trust_score, rank volume_percentage, upper_depth, lower_depth, spread, rank, volume_percentage


fields not confirmed: liquidity, liquidity_score, adjusted_volume_24h, adjusted_volume_24h_rank


*/

var presetInterval = 3600;
var presetUrl = 'https://www.coingecko.com/en/crypto-gainers-losers';
var presetCode = function() {
  setTimeout(function() {
    try {
      console.log('Looking for table');
      var table = document.querySelector('table');
      console.log('Table:', table);
      if (!table) {
        tradrSink('Table not found');
        return;
      }
      var headers = Array.from(table.rows[0].cells).slice(1).map(function(cell) { return cell.textContent.trim(); });
      var rows = Array.from(table.rows).slice(1).map(function(row) {
        var cells = Array.from(row.cells);
        var texts = cells.map(function(cell) { return cell.textContent.trim(); });
        var linkCell = cells[2];
        var a = linkCell ? linkCell.querySelector('a') : null;
        var href = a ? a.href : '';
        var img = linkCell ? linkCell.querySelector('img') : null;
        var src = img ? img.src : '';
        var parts = src.split('/');
        var imageId = parts[5] || '';
        var nameSymbol = texts[2] ? texts[2].split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
        var processedRow = [
          texts[1] || '',
          nameSymbol[0] || '',
          nameSymbol[1] || '',
          texts[3] || '',
          texts[4] || '',
          texts[5] || '',
          href,
          imageId
        ];
        return processedRow;
      });
      var data = [headers].concat(rows);
      tradrSink(data);
    } catch (e) {
      tradrSink('Error: ' + e);
    }
  }, 5000);
};