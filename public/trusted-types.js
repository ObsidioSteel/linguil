if (typeof trustedTypes !== 'undefined') {
  trustedTypes.createPolicy('default', {
    createScriptURL: (url) => {
      // Define a list of trusted script sources.
      const trustedSources = [
        'https://www.gstatic.com/firebasejs/',
        'https://js.stripe.com',
        'https://apis.google.com',
        'https://www.googletagmanager.com',
        'https://accounts.google.com',
      ];

      const scriptUrl = new URL(url, window.location.origin);

      // Check if the script's origin is the same as the document's origin.
      if (scriptUrl.origin === window.location.origin) {
        return scriptUrl.href;
      }

      // Check if the script's origin is in the list of trusted sources.
      for (const trustedSource of trustedSources) {
        if (scriptUrl.href.startsWith(trustedSource)) {
          return scriptUrl.href;
        }
      }

      // If the script source is not trusted, block it by throwing an error.
      console.error(`Blocked script from untrusted source: ${url}`);
      throw new TypeError(`Untrusted script URL: ${url}`);
    }
  });
}