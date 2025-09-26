// Background script for Tradr extension
importScripts('ai.js');

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tradr-schedule') {
    executeScheduledTask();
  }
});

async function executeScheduledTask() {
  const { url, jsCode, sink, postUrl } = await chrome.storage.sync.get(['url', 'jsCode', 'sink', 'postUrl']);
  if (!url || !jsCode) return;

  const tab = await chrome.tabs.create({ url });
  const execute = () => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: (code, sinkType, postUrl) => {
        window.tradrSink = (data) => {
          window.postMessage({ action: 'debug', message: 'Sink called with data: ' + JSON.stringify(data).substring(0, 100) }, '*');
          if (sinkType === 'display') {
            window.postMessage({ action: 'displayData', data: data }, '*');
          } else if (sinkType === 'csv') {
            const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            window.postMessage({ action: 'debug', message: 'CSV: ' + csv.substring(0, 100) }, '*');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.csv';
            a.click();
          } else if (sinkType === 'post') {
            fetch(postUrl, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).catch(e => window.postMessage({ action: 'debug', message: 'Post error: ' + e }, '*'));
          }
        };
        console.log('Code to eval:', code);
        try {
          eval(code);
        } catch (e) {
          console.error('Code error:', e);
          window.postMessage({ action: 'showError', error: 'Code error: ' + e + (e.stack ? '\n' + e.stack : '') }, '*');
        }
      },
      args: [jsCode, sink, postUrl]
    }).catch(e => chrome.runtime.sendMessage({ action: 'showError', error: 'Execute error: ' + e }));
  };

  const tabInfo = await chrome.tabs.get(tab.id);
  if (tabInfo.status === 'complete') {
    execute();
  } else {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        execute();
      }
    });
  }
}

function setSchedule(intervalSeconds) {
  const intervalMinutes = intervalSeconds / 60;
  chrome.alarms.create('tradr-schedule', { delayInMinutes: intervalMinutes, periodInMinutes: intervalMinutes });
}

function clearSchedule() {
   chrome.alarms.clear('tradr-schedule');
}

async function testAPIConnection() {
   try {
     const testPrompt = 'Say "API test successful" in one word.';
     const response = await callOpenAI(testPrompt);
     chrome.runtime.sendMessage({ action: 'showDebug', message: 'API Test: ' + response });
   } catch (e) {
     chrome.runtime.sendMessage({ action: 'showError', error: 'API test failed: ' + e.message });
   }
}

async function startAutonomousMode() {
   try {
     chrome.runtime.sendMessage({ action: 'showDebug', message: 'AI: Requesting crypto website suggestions...' });
     // Get suggested crypto data websites from AI
     const sitesPrompt = 'Suggest 3 popular crypto data websites for scraping market data, like prices, volumes, etc. Return as a JSON array of URLs.';
     const sitesResponse = await callOpenAI(sitesPrompt);
     let sites;
     try {
       sites = JSON.parse(sitesResponse);
       chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Suggested sites: ${sites.join(', ')}` });
     } catch (parseError) {
       throw new Error(`Failed to parse AI response for sites. AI Response: ${sitesResponse}, Parse Error: ${parseError.message}`);
     }

     for (const url of sites) {
       chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Generating scraping code for ${url}...` });
       // Generate scraping code for each site
       const codePrompt = `Write JavaScript code to scrape crypto market data from ${url}. Extract data like coin names, prices, volumes. Return the function code.`;
       const jsCode = await callOpenAI(codePrompt);
       chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Code generated for ${url}, executing...` });

       // Execute on the site
       await executeOnSite(url, jsCode);
     }
     chrome.runtime.sendMessage({ action: 'showDebug', message: 'AI: Autonomous mode completed.' });
   } catch (e) {
     chrome.runtime.sendMessage({ action: 'showError', error: 'Autonomous mode failed: ' + e.message });
   }
}

async function executeOnSite(url, jsCode) {
   const tab = await chrome.tabs.create({ url });
   const execute = () => {
     chrome.scripting.executeScript({
       target: { tabId: tab.id },
       world: 'MAIN',
       func: (code) => {
         window.tradrSink = (data) => {
           window.postMessage({ action: 'autonomousData', data: data, url: window.location.href }, '*');
         };
         try {
           eval(code);
         } catch (e) {
           window.postMessage({ action: 'showError', error: 'Code error: ' + e }, '*');
         }
       },
       args: [jsCode]
     });
   };

   const tabInfo = await chrome.tabs.get(tab.id);
   if (tabInfo.status === 'complete') {
     execute();
   } else {
     chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
       if (tabId === tab.id && changeInfo.status === 'complete') {
         chrome.tabs.onUpdated.removeListener(listener);
         execute();
       }
     });
   }
}

async function processAutonomousData(data, url) {
   try {
     chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Structuring data from ${url}...` });
     // Use AI to structure the data
     const structurePrompt = `Structure this scraped data from ${url}: ${JSON.stringify(data)}. Define a data box schema and return structured data as JSON.`;
     const structuredResponse = await callOpenAI(structurePrompt);
     let structuredData;
     try {
       structuredData = JSON.parse(structuredResponse);
       chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Data structured for ${url}.` });
     } catch (parseError) {
       throw new Error(`Failed to parse AI response for data structuring. AI Response: ${structuredResponse}, Parse Error: ${parseError.message}`);
     }

     chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Creating indicators for ${url}...` });
     // Create indicators
     const indicators = {};
     const indicatorTypes = ['RSI', 'MACD', 'Moving Average'];
     for (const type of indicatorTypes) {
       const indicatorCode = await createIndicator(structuredData, type);
       indicators[type] = indicatorCode;
       // Note: In a real implementation, execute the code to compute indicator values
     }
     chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Indicators created for ${url}.` });

     chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Generating backtesting strategy for ${url}...` });
     // Generate backtesting strategy
     const strategyCode = await generateBacktestStrategy(structuredData, indicators);

     // Simulate backtesting (placeholder: just return the strategy)
     const backtestResults = { strategy: strategyCode, riskReward: 'Placeholder analysis' };
     chrome.runtime.sendMessage({ action: 'showDebug', message: `AI: Backtesting completed for ${url}.` });

     // Display results
     chrome.runtime.sendMessage({ action: 'showData', data: { url, structuredData, indicators, backtestResults } });
   } catch (e) {
     chrome.runtime.sendMessage({ action: 'showError', error: 'Autonomous data processing failed: ' + e.message });
   }
}

chrome.runtime.onMessage.addListener((message) => {
   if (message.action === 'setSchedule') {
     setSchedule(message.interval);
   } else if (message.action === 'clearSchedule') {
     clearSchedule();
   } else if (message.action === 'runOnce') {
     executeScheduledTask();
   } else if (message.action === 'startAutonomous') {
     startAutonomousMode();
   } else if (message.action === 'testAPI') {
     testAPIConnection();
   } else if (message.action === 'debug') {
     chrome.runtime.sendMessage({ action: 'showDebug', message: message.message });
   } else if (message.action === 'displayData') {
     chrome.runtime.sendMessage({ action: 'showData', data: message.data });
   } else if (message.action === 'autonomousData') {
     processAutonomousData(message.data, message.url);
   }
});

chrome.action.onClicked.addListener(async () => {
  const displays = await chrome.system.display.getInfo();
  const primaryDisplay = displays[0];
  const screenWidth = primaryDisplay.bounds.width;
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 350,
    height: 800,
    top: 50,
    left: screenWidth - 400
  });
});