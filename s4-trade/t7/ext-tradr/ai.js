// AI integration module using OpenAI API

async function getAISettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'baseUrl', 'model'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        baseUrl: result.baseUrl || 'https://api.openai.com/v1',
        model: result.model || 'gpt-3.5-turbo'
      });
    });
  });
}

async function callOpenAI(prompt, systemMessage = null) {
  const settings = await getAISettings();
  if (!settings.apiKey) {
    throw new Error('OpenAI API key is not set in extension settings. Please enter your API key in the popup.');
  }

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'showDebug',
      message: `AI Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`
    });
  }

  const messages = systemMessage ? [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt }
  ] : [{ role: 'user', content: prompt }];

  const url = `${settings.baseUrl}/chat/completions`;
  const body = JSON.stringify({
    model: settings.model,
    messages: messages,
    max_completion_tokens: 1000
  });

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: body
    });
  } catch (fetchError) {
    throw new Error(`Failed to fetch from OpenAI API. URL: ${url}, Error: ${fetchError.message}`);
  }

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`OpenAI API request failed. Prompt: "${prompt.substring(0, 100)}...", Model: ${settings.model}, Base URL: ${settings.baseUrl}, Status: ${response.status}, Response: ${responseText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    throw new Error(`Failed to parse OpenAI API response as JSON. Response: ${await response.text()}`);
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error(`Unexpected OpenAI API response format. Response: ${JSON.stringify(data)}`);
  }

  const content = data.choices[0].message.content.trim();
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'showDebug',
      message: `AI Response: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
    });
  }

  return content;
}

async function generateScrapingCode(url, dataDescription) {
  const prompt = `Write JavaScript code to extract data from ${url}. The data should include: ${dataDescription}. The code should be executable and call window.tradrSink(data) where data is an array of objects.`;
  const systemMessage = 'You are a helpful assistant that generates JavaScript code for web data extraction. Always provide executable JavaScript code when asked.';
  const response = await callOpenAI(prompt, systemMessage);
  // Send debug info about the generated code
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'showDebug',
      message: `AI Generated Code: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`
    });
  }
  if (!response || response.trim().length === 0) {
    throw new Error(`AI returned empty code for URL: ${url}, Data: ${dataDescription}`);
  }
  return response;
}

async function structureData(unstructuredData) {
  const prompt = `Analyze this unstructured data and define a structured "data box" (schema) for it: ${JSON.stringify(unstructuredData)}. Return a JSON schema or description.`;
  const systemMessage = 'You are a helpful assistant that analyzes data and creates structured schemas.';
  const response = await callOpenAI(prompt, systemMessage);
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'showDebug',
      message: `AI Structured Data: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`
    });
  }
  if (!response || response.trim().length === 0) {
    throw new Error(`AI returned empty structured data for: ${JSON.stringify(unstructuredData).substring(0, 200)}`);
  }
  return response;
}

async function createIndicator(dataBox, indicatorType) {
  const prompt = `Create a ${indicatorType} indicator for this data structure: ${JSON.stringify(dataBox)}. Return JavaScript code for the indicator calculation.`;
  const systemMessage = 'You are a helpful assistant that generates JavaScript code for technical indicators. Always provide executable JavaScript code when asked.';
  const response = await callOpenAI(prompt, systemMessage);
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'showDebug',
      message: `AI Created ${indicatorType} Indicator: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`
    });
  }
  if (!response || response.trim().length === 0) {
    throw new Error(`AI returned empty ${indicatorType} indicator code for data: ${JSON.stringify(dataBox).substring(0, 200)}`);
  }
  return response;
}

async function generateBacktestStrategy(dataBox, indicators) {
  const prompt = `Based on this data box: ${JSON.stringify(dataBox)} and indicators: ${JSON.stringify(indicators)}, create a trading strategy with entry/exit rules. Return the strategy logic in JavaScript.`;
  const systemMessage = 'You are a helpful assistant that generates JavaScript code for trading strategies. Always provide executable JavaScript code when asked.';
  const response = await callOpenAI(prompt, systemMessage);
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'showDebug',
      message: `AI Generated Strategy: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`
    });
  }
  if (!response || response.trim().length === 0) {
    throw new Error(`AI returned empty strategy code for data: ${JSON.stringify(dataBox).substring(0, 200)}, indicators: ${JSON.stringify(indicators).substring(0, 200)}`);
  }
  return response;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { callOpenAI, generateScrapingCode, structureData, createIndicator, generateBacktestStrategy };
}