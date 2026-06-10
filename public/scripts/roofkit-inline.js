// Mounts a RoofKit iframe into every <div data-roofkit-inline-embed>.
// Forwards marketing params + host_page_url for attribution.
(function () {
  function readPair(node) {
    return {
      rooferId:  node && node.getAttribute && node.getAttribute('data-roofer-id'),
      embedSrc:  node && node.getAttribute && node.getAttribute('data-roofkit-inline-src'),
    };
  }
  function scriptMatches(node, pair) {
    return !!(
      node &&
      node.getAttribute &&
      node.getAttribute('data-roofkit-inline-script') !== null &&
      node.getAttribute('data-roofer-id') === pair.rooferId &&
      node.getAttribute('data-roofkit-inline-src') === pair.embedSrc &&
      node.getAttribute('data-roofkit-inline-bound') !== 'true'
    );
  }
  function containerMatches(node, pair) {
    return !!(
      node &&
      node.hasAttribute &&
      node.hasAttribute('data-roofkit-inline-embed') &&
      node.getAttribute('data-roofer-id') === pair.rooferId &&
      node.getAttribute('data-roofkit-inline-src') === pair.embedSrc
    );
  }
  function isMounted(node) {
    return node.hasAttribute('data-roofkit-inline-mounted') || !!node.querySelector('iframe');
  }
  function findFallbackContainer(pair) {
    var containers = document.querySelectorAll('[data-roofkit-inline-embed]');
    for (var i = 0; i < containers.length; i += 1) {
      if (containerMatches(containers[i], pair) && !isMounted(containers[i])) {
        return containers[i];
      }
    }
    return null;
  }
  function resolveInlineScript(pair) {
    if (scriptMatches(document.currentScript, pair)) return document.currentScript;
    var scripts = document.querySelectorAll('script[data-roofkit-inline-script]');
    for (var i = 0; i < scripts.length; i += 1) {
      if (scriptMatches(scripts[i], pair)) return scripts[i];
    }
    return null;
  }

  var marketingKeys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","gbraid","wbraid","fbclid","msclkid","ttclid","li_fat_id","ref","gclsrc"];
  var deepLinkKeys = ["material","shape","color"];
  function shouldKeepParam(key) {
    return marketingKeys.indexOf(String(key).toLowerCase()) !== -1;
  }
  function readFirstNonEmptyParam(searchParams, key) {
    var values = searchParams.getAll(key);
    for (var i = 0; i < values.length; i += 1) {
      var trimmed = String(values[i]).trim();
      if (trimmed) return trimmed;
    }
    return '';
  }
  function buildHostPageUrl() {
    try {
      var hostUrl = new URL(window.location.href);
      var sanitized = new URL(hostUrl.origin + hostUrl.pathname);
      hostUrl.searchParams.forEach(function (value, key) {
        if (shouldKeepParam(key)) sanitized.searchParams.append(key, value);
      });
      return sanitized.toString();
    } catch (error) {
      return '';
    }
  }
  function appendDeepLinkParams(iframeUrl) {
    var hostParams = new URLSearchParams(window.location.search);
    deepLinkKeys.forEach(function (key) {
      var value = readFirstNonEmptyParam(hostParams, key);
      if (value) iframeUrl.searchParams.set(key, value);
    });
  }

  function mountOne(scriptNode) {
    var pair = readPair(scriptNode);
    if (!pair.rooferId || !pair.embedSrc) return;
    var container = scriptNode.previousElementSibling;
    if (!containerMatches(container, pair)) container = findFallbackContainer(pair);
    if (!container || isMounted(container)) {
      if (scriptNode) scriptNode.setAttribute('data-roofkit-inline-bound', 'true');
      return;
    }
    try {
      scriptNode.setAttribute('data-roofkit-inline-bound', 'true');
      container.setAttribute('data-roofkit-inline-mounted', 'true');
      var iframeUrl = new URL(pair.embedSrc);
      appendDeepLinkParams(iframeUrl);
      var hostPageUrl = buildHostPageUrl();
      if (hostPageUrl) iframeUrl.searchParams.set('host_page_url', hostPageUrl);
      var iframe = document.createElement('iframe');
      iframe.src = iframeUrl.toString();
      iframe.width = "100%";
      iframe.height = container.getAttribute('data-height') || "760";
      iframe.title = "Roof visualization";
      iframe.loading = "lazy";
      iframe.allow = "clipboard-write; clipboard-read; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.style.cssText = "border:0;display:block;max-width:100%;";
      container.appendChild(iframe);
    } catch (error) {
      container.removeAttribute('data-roofkit-inline-mounted');
      scriptNode.removeAttribute('data-roofkit-inline-bound');
    }
  }

  // Mount every unbound inline-script on the page (supports multiple embeds).
  var allScripts = document.querySelectorAll('script[data-roofkit-inline-script]:not([data-roofkit-inline-bound="true"])');
  for (var i = 0; i < allScripts.length; i += 1) mountOne(allScripts[i]);
})();
