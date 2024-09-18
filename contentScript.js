function analyzePage() {

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'analyzePage') {
          const results = {};
      
          // Page Title
          results.title = document.title;
          results.titleLength = document.title.length;
      
          // Meta Description
          const metaDescription = document.querySelector('meta[name="description"]');
          results.metaDescription = metaDescription ? metaDescription.content : 'Not found';
          results.metaDescriptionLength = metaDescription ? metaDescription.content.length : 0;
      
          // Meta Keywords
          const metaKeywords = document.querySelector('meta[name="keywords"]');
          results.metaKeywords = metaKeywords ? metaKeywords.content : 'Not found';
      
          // Meta Robots
          const metaRobots = document.querySelector('meta[name="robots"]');
          results.metaRobots = metaRobots ? metaRobots.content : 'Not found';
      
          // Canonical URL
          const linkCanonical = document.querySelector('link[rel="canonical"]');
          results.canonicalURL = linkCanonical ? linkCanonical.href : 'Not found';
      
          // Header Tags
          results.headers = {};
          for (let i = 1; i <= 6; i++) {
            const headers = document.querySelectorAll(`h${i}`);
            results.headers[`h${i}`] = Array.from(headers).map(h => h.textContent);
          }
      
          // Images Missing Alt Attributes
          const images = document.querySelectorAll('img');
          results.imagesWithoutAlt = Array.from(images)
            .filter(img => !img.hasAttribute('alt') || img.getAttribute('alt').trim() === '')
            .map(img => img.src);
      
          // Open Graph Tags
          const ogTags = document.querySelectorAll('meta[property^="og:"]');
          results.openGraph = {};
          ogTags.forEach(tag => {
            results.openGraph[tag.getAttribute('property')] = tag.getAttribute('content');
          });
      
          // Twitter Card Tags
          const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
          results.twitterCard = {};
          twitterTags.forEach(tag => {
            results.twitterCard[tag.getAttribute('name')] = tag.getAttribute('content');
          });
      
          // Structured Data Detection (Schema.org)
          const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
          results.structuredData = Array.from(structuredDataScripts).map(script => script.textContent);
      
          // Language and Locale
          results.language = document.documentElement.lang || 'Not specified';
      
          // Viewport Meta Tag
          const metaViewport = document.querySelector('meta[name="viewport"]');
          results.metaViewport = metaViewport ? metaViewport.content : 'Not found';
      
          // Favicon Detection
          const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
          results.favicon = favicon ? favicon.href : 'Not found';
      
          // Links Count
          const allLinks = document.querySelectorAll('a');
          results.internalLinks = Array.from(allLinks).filter(link => link.href.startsWith(window.location.origin)).length;
          results.externalLinks = allLinks.length - results.internalLinks;
      
          // Content Word Count
          const bodyText = document.body.innerText || '';
          results.wordCount = bodyText.trim().split(/\s+/).length;
      
          // Send the results back to the popup
          sendResponse(results);
        }
      });
      
        }
  
  // Wait for the DOM to be fully loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    analyzePage();
  } else {
    document.addEventListener('DOMContentLoaded', analyzePage);
  }
  
