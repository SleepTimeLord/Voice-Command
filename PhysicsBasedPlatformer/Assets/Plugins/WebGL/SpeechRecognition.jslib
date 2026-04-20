mergeInto(LibraryManager.library, {
  StartSpeechRecognition: function () {
    // Prevent duplicate instances
    if (window._speechRecognition) {
      try { window._speechRecognition.stop(); } catch(e) {}
      window._speechRecognition = null;
    }

    var fatalErrors = ['not-allowed', 'service-not-allowed', 'audio-capture'];
    window._speechShouldRun = true;

    function createAndStart() {
      if (!window._speechShouldRun) return;

      var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onresult = function (event) {
        var transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        SendMessage('SpeechManager', 'OnSpeechResult', transcript);
      };

      recognition.onerror = function (e) {
        console.warn('Speech error:', e.error);
        if (fatalErrors.indexOf(e.error) !== -1) {
          // Don't restart — user denied mic or hardware missing
          window._speechShouldRun = false;
          SendMessage('SpeechManager', 'OnSpeechError', e.error);
        }
      };

      recognition.onend = function () {
        // Auto-restart unless we deliberately stopped
        if (window._speechShouldRun) {
          setTimeout(createAndStart, 300); // small delay avoids rapid-fire loops
        }
      };

      recognition.start();
      window._speechRecognition = recognition;
    }

    createAndStart();
  },

  StopSpeechRecognition: function () {
    window._speechShouldRun = false; // Signal onend NOT to restart
    if (window._speechRecognition) {
      try { window._speechRecognition.stop(); } catch(e) {}
      window._speechRecognition = null;
    }
  }
});