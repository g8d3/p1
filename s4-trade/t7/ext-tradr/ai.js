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

async function callOpenAI(prompt) {
  const settings = await getAISettings();
  if (!settings.apiKey) {
    throw new Error('OpenAI API key is not set in extension settings. Please enter your API key in the popup.');
  }

  const url = `${settings.baseUrl}/chat/completions`;
  const body = JSON.stringify({
    model: settings.model,
    messages: [{ role: 'user', content: prompt }],
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

  return data.choices[0].message.content.trim();
}

async function generateScrapingCode(url, dataDescription) {
  const prompt = `Write JavaScript code to scrape data from ${url}. The data should include: ${dataDescription}. Return only the function code that extracts and returns the data as an array or object.`;
  return await callOpenAI(prompt);
}

async function structureData(unstructuredData) {
  const prompt = `Analyze this unstructured data and define a structured "data box" (schema) for it: ${JSON.stringify(unstructuredData)}. Return a JSON schema or description.`;
  return await callOpenAI(prompt);
}

async function createIndicator(dataBox, indicatorType) {
  const prompt = `Create a ${indicatorType} indicator for this data structure: ${JSON.stringify(dataBox)}. Return JavaScript code for the indicator calculation.`;
  return await callOpenAI(prompt);
}

async function generateBacktestStrategy(dataBox, indicators) {
  const prompt = `Based on this data box: ${JSON.stringify(dataBox)} and indicators: ${JSON.stringify(indicators)}, create a trading strategy with entry/exit rules. Return the strategy logic in JavaScript.`;
  return await callOpenAI(prompt);
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { callOpenAI, generateScrapingCode, structureData, createIndicator, generateBacktestStrategy };
}