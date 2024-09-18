/* Updated popup.js */

document.addEventListener('DOMContentLoaded', () => {
  const analyzeButton = document.getElementById('analyze-button');
  const aiButton = document.getElementById('ai-button');
  const resultsDiv = document.getElementById('results');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  // Tab functionality
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tab) content.classList.add('active');
      });
    });
  });

  // Analyze Page button click
  analyzeButton.addEventListener('click', () => {
    resultsDiv.innerHTML = '<p>Analyzing...</p>';
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: contentScriptFunction
        },
        (injectionResults) => {
          for (const frameResult of injectionResults) {
            const resultPromise = frameResult.result;
            if (resultPromise && typeof resultPromise.then === 'function') {
              resultPromise.then(results => {
                displayResults(results);
              });
            } else {
              displayResults(frameResult.result);
            }
          }
        }
      );
    });
  });

  // AI-Powered Analysis button click
  aiButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = tabs[0].url;
      chrome.tabs.create({ url: `https://seolytics.ai/analyze?url=${encodeURIComponent(url)}` });
    });
  });

  // Display results in the popup
  function displayResults(data) {
    const { results, feedback } = data;
    resultsDiv.innerHTML = ''; // Clear previous results
  
    if (!results) {
      resultsDiv.innerHTML = '<p>Unable to retrieve data.</p>';
      return;
    }
  
    // Helper function to get status color
    function getStatusColor(status) {
      switch (status) {
        case 'Good':
          return '#4CAF50'; // Green
        case 'Needs Improvement':
          return '#FF9800'; // Orange
        case 'Needs Attention':
          return '#F44336'; // Red
        case 'Info':
          return '#2196F3'; // Blue
        case 'Note':
          return '#9E9E9E'; // Grey
        default:
          return '#FFFFFF'; // White
      }
    }
  
    // Page Title
    createResultSection('Page Title', `
      <p><strong>Title:</strong> ${results.title}</p>
      <p><strong>Length:</strong> ${results.titleLength} characters</p>
      <p style="color: ${getStatusColor(feedback.title.status)};"><strong>Status:</strong> ${feedback.title.message}</p>
    `);
  
    // Meta Description
    createResultSection('Meta Description', `
      <p><strong>Description:</strong> ${results.metaDescription}</p>
      <p><strong>Length:</strong> ${results.metaDescriptionLength} characters</p>
      <p style="color: ${getStatusColor(feedback.metaDescription.status)};"><strong>Status:</strong> ${feedback.metaDescription.message}</p>
    `);
  
    // Meta Keywords
    createResultSection('Meta Keywords', `
      <p><strong>Keywords:</strong> ${results.metaKeywords || 'Not found'}</p>
      <p style="color: ${getStatusColor(feedback.metaKeywords.status)};"><strong>Status:</strong> ${feedback.metaKeywords.message}</p>
    `);
  
    // Meta Robots
    createResultSection('Meta Robots', `
      <p><strong>Robots:</strong> ${results.metaRobots || 'Not found'}</p>
      <p style="color: ${getStatusColor(feedback.metaRobots.status)};"><strong>Status:</strong> ${feedback.metaRobots.message}</p>
    `);
  
    // Canonical URL
    createResultSection('Canonical URL', `
      <p><strong>URL:</strong> ${results.canonicalURL || 'Not found'}</p>
      <p style="color: ${getStatusColor(feedback.canonicalURL.status)};"><strong>Status:</strong> ${feedback.canonicalURL.message}</p>
    `);
  
    // Header Tags
    let headersContent = '';
    for (let i = 1; i <= 6; i++) {
      const headers = results.headers[`h${i}`];
      if (headers && headers.length > 0) {
        headersContent += `<h3>H${i} Tags</h3><ul>`;
        headers.forEach(text => {
          headersContent += `<li>${text}</li>`;
        });
        headersContent += '</ul>';
      }
    }
    headersContent += `<p style="color: ${getStatusColor(feedback.headers.h1.status)};"><strong>Status:</strong> ${feedback.headers.h1.message}</p>`;
    createResultSection('Header Tags', headersContent);
  
    // Images Missing Alt Attributes
    const imagesFeedback = `<p style="color: ${getStatusColor(feedback.imagesWithoutAlt.status)};"><strong>Status:</strong> ${feedback.imagesWithoutAlt.message}</p>`;
    if (results.imagesWithoutAlt && results.imagesWithoutAlt.length > 0) {
      let imagesContent = '<ul>';
      results.imagesWithoutAlt.forEach(src => {
        imagesContent += `<li>${src}</li>`;
      });
      imagesContent += '</ul>' + imagesFeedback;
      createResultSection('Images Missing Alt Attributes', imagesContent);
    } else {
      createResultSection('Images Missing Alt Attributes', imagesFeedback);
    }
  
    // Open Graph Tags
    let ogContent = '';
    if (Object.keys(results.openGraph).length > 0) {
      ogContent += '<ul>';
      for (const [property, content] of Object.entries(results.openGraph)) {
        ogContent += `<li><strong>${property}:</strong> ${content}</li>`;
      }
      ogContent += '</ul>';
    } else {
      ogContent = '<p>No Open Graph tags found.</p>';
    }
    ogContent += `<p style="color: ${getStatusColor(feedback.openGraph.status)};"><strong>Status:</strong> ${feedback.openGraph.message}</p>`;
    createResultSection('Open Graph Tags', ogContent);
  
    // Twitter Card Tags
    let twitterContent = '';
    if (Object.keys(results.twitterCard).length > 0) {
      twitterContent += '<ul>';
      for (const [name, content] of Object.entries(results.twitterCard)) {
        twitterContent += `<li><strong>${name}:</strong> ${content}</li>`;
      }
      twitterContent += '</ul>';
    } else {
      twitterContent = '<p>No Twitter Card tags found.</p>';
    }
    twitterContent += `<p style="color: ${getStatusColor(feedback.twitterCard.status)};"><strong>Status:</strong> ${feedback.twitterCard.message}</p>`;
    createResultSection('Twitter Card Tags', twitterContent);
  
    // Structured Data
    let sdContent = '';
    if (results.structuredData && results.structuredData.length > 0) {
      results.structuredData.forEach((data, index) => {
        sdContent += `<pre>${data}</pre>`;
      });
    } else {
      sdContent = '<p>No structured data found.</p>';
    }
    sdContent += `<p style="color: ${getStatusColor(feedback.structuredData.status)};"><strong>Status:</strong> ${feedback.structuredData.message}</p>`;
    createResultSection('Structured Data', sdContent);
  
    // Language and Locale
    createResultSection('Language and Locale', `
      <p><strong>Language:</strong> ${results.language || 'Not specified'}</p>
      <p style="color: ${getStatusColor(feedback.language.status)};"><strong>Status:</strong> ${feedback.language.message}</p>
    `);
  
    // Viewport Meta Tag
    createResultSection('Viewport Meta Tag', `
      <p><strong>Content:</strong> ${results.metaViewport || 'Not found'}</p>
      <p style="color: ${getStatusColor(feedback.metaViewport.status)};"><strong>Status:</strong> ${feedback.metaViewport.message}</p>
    `);
  
    // Favicon Detection
    createResultSection('Favicon', `
      <p><strong>Favicon URL:</strong> ${results.favicon || 'Not found'}</p>
      <p style="color: ${getStatusColor(feedback.favicon.status)};"><strong>Status:</strong> ${feedback.favicon.message}</p>
    `);
  
    // Links Count
    createResultSection('Links Count', `
      <p><strong>Internal Links:</strong> ${results.internalLinks}</p>
      <p><strong>External Links:</strong> ${results.externalLinks}</p>
      <p style="color: ${getStatusColor(feedback.links.status)};"><strong>Status:</strong> ${feedback.links.message}</p>
    `);
  
    // Content Word Count
    createResultSection('Content Word Count', `
      <p><strong>Word Count:</strong> ${results.wordCount}</p>
      <p style="color: ${getStatusColor(feedback.wordCount.status)};"><strong>Status:</strong> ${feedback.wordCount.message}</p>
    `);
  
    // Security and HTTPS Verification
    let securityContent = `
      <p><strong>Page is served over HTTPS:</strong> ${results.isHTTPS ? 'Yes' : 'No'}</p>
      <p style="color: ${getStatusColor(feedback.isHTTPS.status)};"><strong>Status:</strong> ${feedback.isHTTPS.message}</p>
    `;
    if (results.mixedContent && results.mixedContent.length > 0) {
      securityContent += `<p><strong>Mixed content detected:</strong></p><ul>${results.mixedContent.map(url => `<li>${url}</li>`).join('')}</ul>`;
    } else {
      securityContent += `<p style="color: ${getStatusColor(feedback.mixedContent.status)};"><strong>${feedback.mixedContent.message}</strong></p>`;
    }
    createResultSection('Security and HTTPS Verification', securityContent);
  
    // Robots.txt Content
    let robotsContent = '';
    robotsContent += `<pre>${results.robotsTxt || 'Not found'}</pre>`;
    robotsContent += `<p style="color: ${getStatusColor(feedback.robotsTxt.status)};"><strong>Status:</strong> ${feedback.robotsTxt.message}</p>`;
    createResultSection('robots.txt Content', robotsContent);
  
    // Sitemap.xml Content
    let sitemapContent = '';
    sitemapContent += `<pre>${results.sitemapXml || 'Not found'}</pre>`;
    sitemapContent += `<p style="color: ${getStatusColor(feedback.sitemapXml.status)};"><strong>Status:</strong> ${feedback.sitemapXml.message}</p>`;
    createResultSection('sitemap.xml Content', sitemapContent);
  }
  
  // Function to create result sections without collapsible behavior
  function createResultSection(title, content) {
    const section = document.createElement('div');
    section.className = 'result-section';

    const heading = document.createElement('h2');
    heading.textContent = title;

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = content;

    section.appendChild(heading);
    section.appendChild(contentDiv);

    resultsDiv.appendChild(section);
  }

  // Define the content script function
  function contentScriptFunction() {
    return new Promise(async (resolve) => {
      const results = {};
      const feedback = {};
  
      // Page Title
      results.title = document.title;
      results.titleLength = document.title.length;
      // Evaluation
      if (results.titleLength > 0 && results.titleLength <= 60) {
        feedback.title = { status: 'Good', message: 'Title length is optimal.' };
      } else if (results.titleLength > 60) {
        feedback.title = { status: 'Needs Improvement', message: 'Title is too long.' };
      } else {
        feedback.title = { status: 'Needs Improvement', message: 'Title is missing.' };
      }
  
      // Meta Description
      const metaDescription = document.querySelector('meta[name="description"]');
      results.metaDescription = metaDescription ? metaDescription.content : '';
      results.metaDescriptionLength = metaDescription ? metaDescription.content.length : 0;
      // Evaluation
      if (results.metaDescriptionLength >= 50 && results.metaDescriptionLength <= 160) {
        feedback.metaDescription = { status: 'Good', message: 'Meta description length is optimal.' };
      } else if (results.metaDescriptionLength > 160) {
        feedback.metaDescription = { status: 'Needs Improvement', message: 'Meta description is too long.' };
      } else {
        feedback.metaDescription = { status: 'Needs Improvement', message: 'Meta description is missing or too short.' };
      }
  
      // Meta Keywords (Deprecated, but we can still check)
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      results.metaKeywords = metaKeywords ? metaKeywords.content : '';
      // Evaluation
      if (results.metaKeywords) {
        feedback.metaKeywords = { status: 'Note', message: 'Meta keywords are no longer used by most search engines.' };
      } else {
        feedback.metaKeywords = { status: 'Good', message: 'No meta keywords tag found (recommended).' };
      }
  
      // Meta Robots
      const metaRobots = document.querySelector('meta[name="robots"]');
      results.metaRobots = metaRobots ? metaRobots.content : '';
      // Evaluation
      if (!results.metaRobots || results.metaRobots.toLowerCase() === 'index, follow') {
        feedback.metaRobots = { status: 'Good', message: 'Page is set to be indexed and followed.' };
      } else {
        feedback.metaRobots = { status: 'Needs Attention', message: `Robots meta tag: ${results.metaRobots}` };
      }
  
      // Canonical URL
      const linkCanonical = document.querySelector('link[rel="canonical"]');
      results.canonicalURL = linkCanonical ? linkCanonical.href : '';
      // Evaluation
      if (results.canonicalURL) {
        feedback.canonicalURL = { status: 'Good', message: 'Canonical URL is set.' };
      } else {
        feedback.canonicalURL = { status: 'Needs Improvement', message: 'Canonical URL is missing.' };
      }
  
      // Header Tags
      results.headers = {};
      feedback.headers = {};
      for (let i = 1; i <= 6; i++) {
        const headers = document.querySelectorAll(`h${i}`);
        results.headers[`h${i}`] = Array.from(headers).map(h => h.textContent.trim());
      }
      // Evaluation for H1
      if (results.headers.h1.length === 1) {
        feedback.headers.h1 = { status: 'Good', message: 'One H1 tag found.' };
      } else if (results.headers.h1.length > 1) {
        feedback.headers.h1 = { status: 'Needs Improvement', message: 'Multiple H1 tags found.' };
      } else {
        feedback.headers.h1 = { status: 'Needs Improvement', message: 'No H1 tag found.' };
      }
  
      // Images Missing Alt Attributes
      const images = document.querySelectorAll('img');
      results.imagesWithoutAlt = Array.from(images)
        .filter(img => !img.hasAttribute('alt') || img.getAttribute('alt').trim() === '')
        .map(img => img.src);
      // Evaluation
      if (results.imagesWithoutAlt.length === 0) {
        feedback.imagesWithoutAlt = { status: 'Good', message: 'All images have alt attributes.' };
      } else {
        feedback.imagesWithoutAlt = { status: 'Needs Improvement', message: `${results.imagesWithoutAlt.length} images missing alt attributes.` };
      }
  
      // Open Graph Tags
      const ogTags = document.querySelectorAll('meta[property^="og:"]');
      results.openGraph = {};
      ogTags.forEach(tag => {
        results.openGraph[tag.getAttribute('property')] = tag.getAttribute('content');
      });
      // Evaluation
      if (Object.keys(results.openGraph).length > 0) {
        feedback.openGraph = { status: 'Good', message: 'Open Graph tags are present.' };
      } else {
        feedback.openGraph = { status: 'Needs Improvement', message: 'Open Graph tags are missing.' };
      }
  
      // Twitter Card Tags
      const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
      results.twitterCard = {};
      twitterTags.forEach(tag => {
        results.twitterCard[tag.getAttribute('name')] = tag.getAttribute('content');
      });
      // Evaluation
      if (Object.keys(results.twitterCard).length > 0) {
        feedback.twitterCard = { status: 'Good', message: 'Twitter Card tags are present.' };
      } else {
        feedback.twitterCard = { status: 'Needs Improvement', message: 'Twitter Card tags are missing.' };
      }
  
      // Structured Data Detection (Schema.org)
      const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
      results.structuredData = Array.from(structuredDataScripts).map(script => script.textContent.trim());
      // Evaluation
      if (results.structuredData.length > 0) {
        feedback.structuredData = { status: 'Good', message: 'Structured data is present.' };
      } else {
        feedback.structuredData = { status: 'Needs Improvement', message: 'Structured data is missing.' };
      }
  
      // Language and Locale
      results.language = document.documentElement.lang || '';
      // Evaluation
      if (results.language) {
        feedback.language = { status: 'Good', message: 'Language attribute is set.' };
      } else {
        feedback.language = { status: 'Needs Improvement', message: 'Language attribute is missing.' };
      }
  
      // Viewport Meta Tag
      const metaViewport = document.querySelector('meta[name="viewport"]');
      results.metaViewport = metaViewport ? metaViewport.content : '';
      // Evaluation
      if (results.metaViewport) {
        feedback.metaViewport = { status: 'Good', message: 'Viewport meta tag is set.' };
      } else {
        feedback.metaViewport = { status: 'Needs Improvement', message: 'Viewport meta tag is missing.' };
      }
  
      // Favicon Detection
      const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
      results.favicon = favicon ? favicon.href : '';
      // Evaluation
      if (results.favicon) {
        feedback.favicon = { status: 'Good', message: 'Favicon is present.' };
      } else {
        feedback.favicon = { status: 'Needs Improvement', message: 'Favicon is missing.' };
      }
  
      // Links Count
      const allLinks = document.querySelectorAll('a[href]');
      results.internalLinks = Array.from(allLinks).filter(link => link.href.startsWith(window.location.origin)).length;
      results.externalLinks = allLinks.length - results.internalLinks;
      // Evaluation
      feedback.links = { status: 'Info', message: `Found ${results.internalLinks} internal and ${results.externalLinks} external links.` };
  
      // Content Word Count
      const bodyText = document.body.innerText || '';
      results.wordCount = bodyText.trim().split(/\s+/).length;
      // Evaluation
      if (results.wordCount > 300) {
        feedback.wordCount = { status: 'Good', message: 'Content has a good word count.' };
      } else {
        feedback.wordCount = { status: 'Needs Improvement', message: 'Content word count is low.' };
      }
  
      // Security and HTTPS Verification
      results.isHTTPS = window.location.protocol === 'https:';
      // Evaluation
      if (results.isHTTPS) {
        feedback.isHTTPS = { status: 'Good', message: 'Page is served over HTTPS.' };
      } else {
        feedback.isHTTPS = { status: 'Needs Improvement', message: 'Page is not served over HTTPS.' };
      }
  
      // Mixed Content Detection
      const insecureElements = Array.from(document.querySelectorAll('[src], [href]')).filter(el => {
        const src = el.getAttribute('src') || el.getAttribute('href');
        return src && src.startsWith('http:');
      });
      results.mixedContent = insecureElements.map(el => el.getAttribute('src') || el.getAttribute('href'));
      // Evaluation
      if (results.mixedContent.length === 0) {
        feedback.mixedContent = { status: 'Good', message: 'No mixed content detected.' };
      } else {
        feedback.mixedContent = { status: 'Needs Improvement', message: 'Mixed content detected.' };
      }
  
      // Robots.txt and Sitemap.xml
      async function fetchTextFile(url) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            return await response.text();
          } else {
            return '';
          }
        } catch (error) {
          return '';
        }
      }
  
      const robotsUrl = `${window.location.origin}/robots.txt`;
      const sitemapUrl = `${window.location.origin}/sitemap.xml`;
  
      results.robotsTxt = await fetchTextFile(robotsUrl);
      results.sitemapXml = await fetchTextFile(sitemapUrl);
      // Evaluation for robots.txt
      if (results.robotsTxt) {
        feedback.robotsTxt = { status: 'Good', message: 'robots.txt file is present.' };
      } else {
        feedback.robotsTxt = { status: 'Needs Improvement', message: 'robots.txt file is missing.' };
      }
      // Evaluation for sitemap.xml
      if (results.sitemapXml) {
        feedback.sitemapXml = { status: 'Good', message: 'sitemap.xml file is present.' };
      } else {
        feedback.sitemapXml = { status: 'Needs Improvement', message: 'sitemap.xml file is missing.' };
      }
  
      resolve({ results, feedback });
    });
  }  
});
